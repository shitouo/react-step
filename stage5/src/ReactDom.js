import ReactRoot from './reactRoot.js';
import { createWorkInProgress } from './WorkInProgress.js';
import UpdateQueue from './UpdateQueue.js';
import { FIBERTAGS, REACT_ELEMENT_TYPE, EffectTags, workTime } from "./Constant.js";
import FiberNode from "./FiberNode.js";
import { createUpdate } from './util.js';
import ClassComponentUpdater from './ClassComponentUpdater.js';

window.workInProgressRoot = null;
window.workInProgress = null;
window.didReceiveUpdate = false;

function processUpdateQueue(updateQueue) {
    if (!updateQueue) {
        return;
    }
    let newState = {};
    updateQueue.traverse(function(item) {
        newState = {
            ...newState,
            ...item.payload,
        }
    });
    return newState;
}

// 处理每一个workInProgress节点
function beginWork(workInProgress) {
    const current = workInProgress.alternate;
    // const memorizedState = current.memorizedState;
    const newProps = workInProgress.pendingProps;
    // const newState = workInProgress.stateNode && workInProgress.stateNode.state;
    const updateExpirationTime = workInProgress.expirationTime;
    let nextUnitOfWork;
    if (current) {
        const oldProps = current.memorizedProps;
        if (oldProps !== newProps) {
            didReceiveUpdate = true;
        } else if (updateExpirationTime < workTime.sync) {
            // 没有更新操作
            // 直接clone原来节点就可以，不会走到update
            didReceiveUpdate = false;
            nextUnitOfWork = workInProgress.child = createWorkInProgress(workInProgress.child, newProps);
            return nextUnitOfWork;
        } else {
            // 虽然当前节点没有变化，但是子节点发生了变化
            // 一般引发fiber diff的classComponent节点会是这种情况。
            didReceiveUpdate = false;
        }
    }
    workInProgress.expirationTime = workTime.noWork;
    const tag = workInProgress.tag;

    switch(tag) {
        case FIBERTAGS.HostRoot:
            nextUnitOfWork = updateHostRoot(workInProgress);
            break;
        case FIBERTAGS.ClassComponent:
            nextUnitOfWork = updateClassComponent(workInProgress);
            break;
        case FIBERTAGS.HostComponent:
            nextUnitOfWork = updateHostComponent(workInProgress);
            break;
    }
    return nextUnitOfWork;
}

function updateHostComponent$1(workInProgress) {
    const newProps = workInProgress.pendingProps;
    const oldProps = workInProgress.memorizedProps;
    let updatePayload = [];
    for (let propItem in newProps) {
        if (Object.prototype.hasOwnProperty.call(newProps, propItem)) {
            if (propItem === 'children' && typeof newProps[propItem] !== 'string' && typeof oldProps[propItem] !== 'string') {
                // 对于children属性，只比较children直接是文本的
                continue;
            }
            if (newProps[propItem] !== oldProps[propItem]) {
                updatePayload.push(propItem, newProps[propItem]);
            }
        }
    }
    return updatePayload;
}

// 将子节点中的dom元素添加到当前dom元素中
// 只找各子节点中第一层为HostComponent或者HostText的即可
// 因为回溯的时候已经逐层都添加上去了
function appendAllChildren(parentElement, workInProgress) {
    let child = workInProgress.child;
    while(child) {
        const childTag = child && child.tag;
        if (childTag === FIBERTAGS.HostComponent || childTag === FIBERTAGS.HostText) {
            // html类元素，直接添加
            parentElement.appendChild(child.stateNode);
        } else if (childTag === FIBERTAGS.ClassComponent) {
            // 非html类组件，往下找到最近的那层html类元素
            child = child.child;
            continue;
        }
        const sibling = child.sibling;
        if (sibling) {
            child = sibling;
            continue;
        }
        if (child === workInProgress) {
            // 回到了当前节点，添加完成
            return;
        }
        while(child.sibling === null) {
            child = child.return;
            if (!child || child === workInProgress) {
                return;
            }
        }
    }
}

function completeWork(workInProgress) {
    // diff当前节点
    const tag = workInProgress.tag;
    switch (tag) {
        case FIBERTAGS.ClassComponent: {
            break;
        }
        case FIBERTAGS.HostComponent: {
            if (workInProgress.alternate) {
                // 非首次创建
                // 只diff属性，生成uploadPayload,
                // 在commit阶段再进行实际的处理
                const updatePayload = updateHostComponent$1(workInProgress);
                if (updatePayload && updatePayload.length > 0) {
                    workInProgress.updatePayload = updatePayload;
                    workInProgress.effectTag |= EffectTags.Update;
                }
            } else {
                // 首次创建，
                // 在此时就要生成dom element
                // 此时先不要处理属性，等到commit阶段，和更新一同处理
                const newElement = document.createElement(workInProgress.type);
                newElement._reactInternalFiber = workInProgress;
                newElement.internalProps = workInProgress.pendingProps;
                // 对于首次创建dom的这些节点，需要把下一层appendAllChildren，这样
                // 最后只要用最顶层那个首次创建dom的节点的Placement EffectTag，
                // 就可以一次性的将所有新dom节点更新到dom上了。
                workInProgress.stateNode = newElement;
                appendAllChildren(newElement, workInProgress);
                // 提前将dom属性装载到dom节点上，这样可以给commit阶段减轻工作量
                const props = workInProgress.pendingProps; // 注意这里要使用pendingProps
                if (props) {
                    for(let key in props) {
                        updateDomProperties(newElement, key, props[key]);
                    }
                }
            }
            workInProgress.memorizedProps = workInProgress.pendingProps;
            workInProgress.pendingProps = null;
            break;
        }
        case FIBERTAGS.HostRoot: {
            // Nope
            break;
        }
    }
}

function completeUnitofWork(workInProgress) {
    while (true) {
        let returnFiber = workInProgress.return;
        let siblingFiber = workInProgress.sibling;
        if (!returnFiber) {
            // 已经走到root节点
            return null;
        }
        // diff当前节点
        completeWork(workInProgress);

        // 首先将自身身上挂着的effects传递到return上
        if (workInProgress.firstEffect) {
            if (!returnFiber.firstEffect) {
                // 还未添加effect
                returnFiber.firstEffect = workInProgress.firstEffect;
            } else {
                // return已经添加过effect
                returnFiber.lastEffect.nextEffect = workInProgress.firstEffect;
            }
            returnFiber.lastEffect = workInProgress.lastEffect;
        }
        // 如果自身也有effectTag，则还需要将自身挂到return上
        // 可以看出这里将来对effect执行的顺序是越靠下的fiber节点，会越早得到执行
        if (workInProgress.effectTag > EffectTags.PerformedWork) {
            if (!returnFiber.firstEffect) {
                returnFiber.firstEffect = workInProgress;
            } else {
                returnFiber.lastEffect.nextEffect = workInProgress;
            }
            returnFiber.lastEffect = workInProgress;
        }

        // 寻找下一个要update的节点
        if (siblingFiber) {
            return siblingFiber;
        }
        if (returnFiber) {
            workInProgress = returnFiber;
            continue;
        }
    }
}

function updateHostComponent(workInProgress) {
    const nextProps = workInProgress.pendingProps;
    let nextChildren = nextProps.children;
    if (typeof nextChildren === 'string') {
        // 如果当前hostComponent只有一个字符串的child，那就不再这个文本节点创建fiber节点了
        // 这样可以少生成一些fiber 节点。
        nextChildren = null;
    }
    workInProgress.child = reconcileChildren(workInProgress.alternate, workInProgress, nextChildren);
    // workInProgress.memorizedProps = nextProps;
    // workInProgress.pendingProps = null;
    return workInProgress.child;
}

function updateClassComponent(workInProgress) {
    const current = workInProgress.alternate;
    const ctor = workInProgress.type;
    const getDerivedStateFromProps = ctor.getDerivedStateFromProps;
    let instance = workInProgress.stateNode;
    if (!instance) {
        // 之前没有实例化过，所以需要实例化
        instance = new ctor();
        workInProgress.stateNode = instance;
        // 也要把fiber节点挂到instance上，方便setState时使用
        instance._reactInternalFiber = workInProgress;
        instance.updater = new ClassComponentUpdater();
        const componentDidMount = instance.componentDidMount;
        if (typeof componentDidMount === 'function') {
            workInProgress.effectTag |= EffectTags.Update;
        }
    } else {
        // 已经实例化过，处理updateQueue
        const updateQueue = workInProgress.updateQueue;
        const newState = processUpdateQueue(updateQueue);
        workInProgress.updateQueue = null;
        workInProgress.memorizedState = newState;
        instance.state = newState;
    }
    // 执行getDerivedStateFromProps
    if (typeof getDerivedStateFromProps === 'function') {
        const prevState = workInProgress.memorizedState;
        const nextProps = workInProgress.pengdingProps;
        const partialState = getDerivedStateFromProps(nextProps, prevState);
        if (partialState) {
            workInProgress.memorizedState = partialState;
        }
    }

    const children = instance.render();
    workInProgress.child = reconcileChildren(current, workInProgress, children);
    return workInProgress.child;
}

function updateHostRoot(workInProgress) {
    const updateQueue = workInProgress.updateQueue;
    const newState = processUpdateQueue(updateQueue);
    workInProgress.updateQueue = null;
    workInProgress.memorizedState = newState;
    workInProgress.child = reconcileChildren(workInProgress.alternate, workInProgress, newState);
    return workInProgress.child;
}

function createFiberNode(type, pendingProps, key) {
    let newFiberNode;
    if (typeof type === 'function') {
        // 函数或者class组件
        newFiberNode = new FiberNode(FIBERTAGS.ClassComponent, pendingProps, key, type);
    } else if (typeof type === 'string') {
        // hostComponent
        newFiberNode = new FiberNode(FIBERTAGS.HostComponent, pendingProps, key, type);
    }
    return newFiberNode;
}

function reconcileChildren(current, workInProgress, nextChildren) {
    let currentChild = current && current.child
    if (Array.isArray(nextChildren)) {
        let prevNewFiberNode = null;
        nextChildren.forEach((child, index) => {
            let newFiberNode = reconcileSingleElement(currentChild, current, workInProgress, child);
            if (index === 0) {
                workInProgress.child = newFiberNode;
            } else {
                prevNewFiberNode.sibling = newFiberNode;
            }
            prevNewFiberNode = newFiberNode;
            currentChild = currentChild && currentChild.sibling;
        })
        return workInProgress.child;
    } else {
        return reconcileSingleElement(currentChild, current, workInProgress, nextChildren);
    }
}

function reconcileSingleElement(currentChild, current, workInProgress, nextChildren) {
    if (!nextChildren) {
        return null;
    }
    let newFiberNode = null;
    const type = nextChildren.type;
    const key = nextChildren.key;
    const pendingProps = nextChildren.props;
    if (!currentChild) {
        // 如果没有current或者current.child，则说明是新添加的节点。直接按照nextChildren创建
        newFiberNode = createFiberNode(type, pendingProps, key);
        if (current) {
            // current tree首先出现的null，需要将workInProgress的EffectTag标识为Placement
            newFiberNode.effectTag |= EffectTags.Placement;
        }
        newFiberNode.return = workInProgress;
    } else {
        // current上存在child
        if (currentChild.type !== type || currentChild.key !== key) {
            // type已经发生了变化
            // 或者key发生了变化
            // 都说明原来的child已经被卸载了
            currentChild.effectTag |= EffectTags.Deletion;
            // 这里要提前将这个旧节点放到return中，因为后面回溯的时候，回溯的是新生成的节点
            const lastEffect = workInProgress.lastEffect;
            if (lastEffect) {
                workInProgress.lastEffect.next = currentChild;
            }
            workInProgress.lastEffect = currentChild;
            newFiberNode = createFiberNode(type, pendingProps, key);
            newFiberNode.return = workInProgress;
        } else {
            // 没有大的变动，只是做了些属性更新
            newFiberNode = createWorkInProgress(currentChild, pendingProps);
            newFiberNode.return = workInProgress;
        }
    }
    return newFiberNode;
}

function performSyncWorkOnRoot(workInProgress) {
    // update阶段，可以被打断
    while(workInProgress) {
        workInProgress = performUnitOfWork(workInProgress);
    }
    // 提交阶段，不能被打断
    // 将Fiber tree映射到页面上
    // 此时的workInProgress就是rootFiber节点了。
    commit();
}

function performUnitOfWork(workInProgress) {
    let nextUnitOfWork = beginWork(workInProgress);
    if (!nextUnitOfWork) {
        // 当前分支已经走到了最后
        // 提交update的结果
        // 并寻找下一个需要update的节点
        nextUnitOfWork = completeUnitofWork(workInProgress);
    }
    return nextUnitOfWork;
}

function render(reactElement, container) {
    // 根据container生成ReactRoot根节点
    const reactRoot = new ReactRoot(container);

    workInProgressRoot = reactRoot;
    workInProgress = createWorkInProgress(workInProgressRoot.root, null);
    // root的workInProgress的updateQueue暂时写死
    workInProgress.updateQueue = new UpdateQueue();
    workInProgress.updateQueue.addUpdate(createUpdate(reactElement));
    workInProgress.expirationTime = workTime.sync;
    performSyncWorkOnRoot(workInProgress);
}

function commit() {
    // 将修改一次性提交到页面上
    const root = window.workInProgressRoot;
    const currentrRootFiber = root.root;
    const rootFiber = currentrRootFiber.alternate; // workInProgress tree上的root节点
    let nextEffect = rootFiber.firstEffect;
    const { Placement, Update, Deletion } = EffectTags;
    while (nextEffect) {
        const effectTag = nextEffect.effectTag;
        // 需要预先过滤掉EffectTag中不是下面这三种的部分，因为如果不过滤的话，下面的switch就不会生效了。
        // const primaryEffectTag = effectTag & (Placement | Update | Deletion);
        if (effectTag & Placement) {
            commitPlacement(nextEffect);
            nextEffect.effectTag &= ~Placement;
        }
        if (effectTag & Update) {
            commitUpdate(nextEffect);
            nextEffect.effectTag &= ~Update;
        }
        if (effectTag & Deletion) {
            commitDeletion(nextEffect);
            nextEffect.effectTag &= ~Deletion;
        }
        nextEffect = nextEffect.nextEffect;
    }

}

function getHostParentFiber(fiber) {
    let parent = fiber.return;
    while (parent) {
        if (parent.tag === FIBERTAGS.HostComponent || parent.tag === FIBERTAGS.HostRoot) {
            return parent;
        }
        parent = parent.return;
    }
    throw new Error('cannot find a host parent!');
}

function commitPlacement(finishedWork) {
    // 插入到页面的过程中，需要考虑父节点的类型，如果父节点是hostComponent，那么直接插入就好，如果父节点是classComponent，那么就要考虑父节点的父节点
    // 插入子节点时，必须要找到各子节点的首层HostComponent或者HostText节点
    const parentFiber = getHostParentFiber(finishedWork);
    const parentDomNode = parentFiber.stateNode;
    appendAllChildren(parentDomNode, finishedWork);
}

function commitUpdate(finishedWork) {
    const updatePayload = finishedWork.updatePayload || [];
    const finishedWorkDomNode = finishedWork.stateNode;

    if (finishedWork.tag === FIBERTAGS.HostComponent) {
        for (let i = 0, length = updatePayload.length; i < length; i += 2) {
            const propName = updatePayload[i];
            const propValue = updatePayload[i + 1];
    
            updateDomProperties(finishedWorkDomNode, propName, propValue);
        }
    } else if (finishedWork.tag === FIBERTAGS.ClassComponent) {
        // 有CDM生命周期时，也会标识Update的effectTag
        const instance = finishedWork.stateNode;
        instance.componentDidMount();
    }
}

// 将dom属性应用到dom节点上
function updateDomProperties(domElement, propName, propValue) {
    const events = ['onClick', 'onChange'];
    const customStyles = {
        'fontSize': 'font-size',
        'textAlign': 'text-align'
    };

    if (events.includes(propName)) {
        domElement[propName.toLowerCase()] = function(event) {
            propValue();
            // 执行完事件handler后，如果需要fiber diff，开始执行fiber diff
            if (window.syncQueue) {
                const currentRootFiber = window.syncQueue[0];
                workInProgress = createWorkInProgress(currentRootFiber, null);
                performSyncWorkOnRoot(workInProgress);
            }
        };
    }

    // 判断props里面是否有className需要处理
    if (propName === 'className') {
        domElement.setAttribute('class', propValue);
    }

    // 判断props中是否有style需要处理
    if (propName === 'style') {
        let styleString = '';
        for (let styleItem in propValue) {
            if (propValue.hasOwnProperty(styleItem)) {
                if (customStyles.hasOwnProperty(styleItem)) {
                    const validStyleName = customStyles[styleItem];
                    customStyles[validStyleName] = propValue[styleItem];
                    styleString += `${validStyleName}: ${propValue[styleItem]};`;
                    delete propValue[styleItem];
                    continue;
                }
                styleString += `${styleItem}: ${propValue[styleItem]};`;
            }
        }
        domElement.setAttribute('style', styleString);
    }
    // 判断props中有没有直接要添加的文本节点
    if (propName === 'children' && typeof propValue === 'string') {
        domElement.innerText = propValue;
    }
}

function commitDeletion(finishedWork) {
    // 如果diff到之前的fiber节点已经被删除了，那么给新节点标识一个delete的effectTag，并且后面的节点都不用再做diff？
    // 如果当前节点标识了删除，那么需要找到当前节点的父节点，然后removeChild
    const parentFiber = getHostParentFiber(finishedWork);
    const parentDomNode = parentFiber.stateNode;
    const finishedWorkDomNode = finishedWork.stateNode;
    parentDomNode.removeChild(finishedWorkDomNode);
}

let ReactDom = {
    render: render
};

export default ReactDom;