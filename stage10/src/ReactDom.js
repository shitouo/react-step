import ReactRoot from './reactRoot.js';
import { createWorkInProgress } from './WorkInProgress.js';
import UpdateQueue from './UpdateQueue.js';
import { FIBERTAGS, REACT_ELEMENT_TYPE, EffectTags, workTime, modeMap, MaxSigned31BitInt, REACT_PROVIDER_TYPE, UpdateTags, HookEffectTags } from "./Constant.js";
import FiberNode from "./FiberNode.js";
import { createUpdate, expirationTimeToMs, requestCurrentTime } from './util.js';
import ClassComponentUpdater from './ClassComponentUpdater.js';
import { HooksDispatcherOnMount } from './hooks.js';

window.didReceiveUpdate = false;
window.isBatchingUpdates = false;
window.firstCallbackNode = null;
window.currentDidTimeout = false;
window.activeFrameTime = 33;
window.nextUnitOfWork = null;
window.callbackExpirationTime = workTime.noWork; // 用来区分每次的异步，在一次异步中，如果有多次setState，则只会生成一个callbackNode
window.nextRenderExpirationTime = workTime.noWork; // 当前reconcile任务的过期时间
window.channel = new window.MessageChannel();
window.valueStack = [];
window.fiberStack = [];
window.valueCursor = createCursor(null);
window.isPrimaryRenderer = true;
window.index = -1;

window.reactCurrentDispatcher$1 = window.reactCurrentDispatcher;
window.didScheduleRenderPhaseUpdate = false;
window.renderPhaseUpdates = null;


window.channel.port1.onmessage = function() {
    // 每个帧内空闲时间实际的执行函数
    // 首先判断当前时间是否已经超出了当前帧
    const currentTime = performance.now();
    let prevSchduledCallback = window.firstCallbackNode;
    let didTimeout = false;
    if (window.frameDeadline - currentTime <= 0) {
        // 当前帧已经没有空闲时间
        // 判断当前任务是否超时
        const expirationTime = prevSchduledCallback.expirationTime;
        const timeoutTime = expirationTimeToMs(expirationTime);
        if (timeoutTime - currentTime <= 0) {
            // 超时, 需要强制不打断执行
            didTimeout = true;
            window.currentDidTimeout = false;
            // 一次性执行完所有的过期任务
            while(true) {
                flushFirstCallback(didTimeout);
                if (expirationTimeToMs(window.firstCallbackNode.expirationTime) - performance.now() <= 0) {
                    continue;
                } else {
                    break;
                }    
            }
        }
    } else {
        // 当前帧还有空闲时间
        flushFirstCallback(didTimeout);
    }
}

function processUpdateQueue(updateQueue, renderExpirationtime) {
    if (!updateQueue) {
        return;
    }
    let newState = {};
    updateQueue.traverse(function(item) {
        if (item.expirationTime >= renderExpirationtime) {
            newState = {
                ...newState,
                ...item.payload,
            }
        }
    });
    return newState;
}

// 处理每一个workInProgress节点
function beginWork(workInProgress, renderExpirationtime) {
    const current = workInProgress.alternate;
    // const memorizedState = current.memorizedState;
    const newProps = workInProgress.pendingProps;
    // const newState = workInProgress.stateNode && workInProgress.stateNode.state;
    const updateExpirationTime = workInProgress.expirationTime;
    let nextUnitOfWork;
    // 如果存在current，就要结合过期时间，来考虑当前节点是否需要更新
    // 如果不存在current，则说明是新生成的节点，肯定是要进行更新的
    if (current) {
        const oldProps = current.memorizedProps;
        if (oldProps !== newProps) {
            // 如果是父节点传过来的属性发生变化，则要进行更新
            didReceiveUpdate = true;
        } else if (updateExpirationTime < renderExpirationtime) {
            // 当前节点的过期时间小于当前任务的过期时间，说明当前节点没有更新，或者更新并不属于这次的任务
            // 直接生成子节点
            didReceiveUpdate = false;
            nextUnitOfWork = workInProgress.child = createWorkInProgress(workInProgress.child, workInProgress.child && workInProgress.child.pendingProps);
            nextUnitOfWork.return = workInProgress;
            if (workInProgress.tag === FIBERTAGS.ClassComponent) { // 将组件实例对应的fiber节点变到workInProgress上来
                // 这里react并没有这个操作，而是通过root的current属性来记录哪个tree是当下状态的
                const instance = workInProgress.stateNode;
                if (instance) {
                    instance._reactInternalFiber = workInProgress
                }
            }
            return nextUnitOfWork;
        }
    } else {
        didReceiveUpdate = false;
    }
    workInProgress.expirationTime = workTime.noWork;
    const tag = workInProgress.tag;

    switch(tag) {
        case FIBERTAGS.HostRoot:
            nextUnitOfWork = updateHostRoot(workInProgress, renderExpirationtime);
            break;
        case FIBERTAGS.ClassComponent:
            nextUnitOfWork = updateClassComponent(workInProgress, renderExpirationtime);
            break;
        case FIBERTAGS.FunctionComponent: 
            nextUnitOfWork = updateFunctionComponent(workInProgress, renderExpirationtime);
            break;    
        case FIBERTAGS.HostComponent:
            nextUnitOfWork = updateHostComponent(workInProgress);
            break;
        case FIBERTAGS.ContextConsumer:
            nextUnitOfWork = updateContextComsumer(workInProgress, renderExpirationtime);
            break;
        case FIBERTAGS.ContextProvider:
            nextUnitOfWork = updateContextProvider(workInProgress, renderExpirationtime);
            break;                
    }
    return nextUnitOfWork;
}


function updateHostComponent$1(workInProgress) {
    const newProps = workInProgress.pendingProps || {};
    const oldProps = workInProgress.memorizedProps || {};
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
    workInProgress.memorizedProps = newProps;
    workInProgress.pendingProps = null;
    return updatePayload;
}

function readContext(context, observedBits) {
    if (window.lastContexWithAllBitsObserved === context) {
        // noop
    } else if (observedBits === false || observedBits === 0) {
        // noop
    } else {
        let resolvedObservedBits = void 0;
        if (typeof observedBits !== 'number' || observedBits === MaxSigned31BitInt) {
            window.lastContexWithAllBitsObserved = context;
            resolvedObservedBits = MaxSigned31BitInt;
        } else {
            resolvedObservedBits = observedBits;
        }
        let contextItem = {
            context: context,
            observedBits: resolvedObservedBits,
            next: null,
        }
        if (!window.lastContextDependency) {
            window.lastContextDependency = contextItem;
            window.currentlyRenderingFiber.contextDependencies = {
                first: contextItem,
                expirationTime: workTime.noWork,
            }
        } else {
            lastContextDependency = lastContextDependency.next = contextItem;
        }
    }
    return window.isPrimaryRenderer ? context._currentValue : context._currentValue2;
}

function prepareToReadContext(workInProgress, renderExpirationtime) {
    window.currentlyRenderingFiber = workInProgress;
    window.lastContexWithAllBitsObserved = null;
    window.lastContextDependency = null;
    let currentDependencies = workInProgress.contextDependencies;
    if (currentDependencies && currentDependencies.expirationTime >= renderExpirationtime) {
        window.didReceiveUpdate = true;
    }
    workInProgress.contextDependencies = null;
}

function updateContextComsumer(workInProgress, renderExpirationtime) {
    const context = workInProgress.type._context;
    const newProps = workInProgress.pendingProps;
    const render = newProps.children;
    if (typeof render !== 'function') {
        throw new Error('Context.Consumer的child应该是函数')
    }
    prepareToReadContext(workInProgress, renderExpirationtime);
    const newValue = readContext(context);
    let newChildren = null;
    newChildren = render(newValue);

    workInProgress.effectTag |= EffectTags.PerformedWork;
    workInProgress.child = reconcileChildren(workInProgress.alternate, workInProgress, newChildren);
    return workInProgress.child;
}

// provider其实是context开放的修改的API
function updateContextProvider(workInProgress, renderExpirationtime) {
    const newProps = workInProgress.pendingProps;
    const oldProps = workInProgress.memorizedProps;
    const context = workInProgress.type._context;
    const newValue = newProps.value;

    pushProvider(workInProgress, newValue);

    if (oldProps !== null) {
        const oldValue = oldProps.value;
        // diff
        if (oldValue !== newValue) {
            let changedBits = typeof context._calculateChangeBits === 'function' ? context._calculateChangeBits(oldValue, newValue) : MaxSigned31BitInt;
            changedBits |= 0;
            // 使provider后代中，使用了当前context的全部强制更新
            propagateContextChange(workInProgress, context, changedBits, renderExpirationtime);
        }
    }
    workInProgress.memorizedProps = newProps;
    let newChildren = newProps.children;
    workInProgress.child = reconcileChildren(workInProgress.alternate, workInProgress, newChildren);
    return workInProgress.child;
}

function pushProvider(providerFiber, nextValue) {
    const context = providerFiber.type._context;
    if (window.isPrimaryRenderer) {
        push(window.valueCursor, context._currentValue, providerFiber);
        context._currentValue = nextValue;
    } else {
        push(window.valueCursor, context._currentValue2, providerFiber);
        context._currentValue2 = nextValue;
    }
}

function push(cursor, value, fiber) {
    window.index++;
    window.valueStack[index] = cursor.current;
    window.fiberStack[index] = fiber;
    cursor.current = value;
}

function createCursor(defaultValue) {
    return {
        current: defaultValue,
    }
}

function propagateContextChange(workInProgress, context, changedBits, renderExpirationtime) {
    let fiber = workInProgress.child;
    if (fiber) {
        fiber.return = workInProgress;
    }
    while(fiber) {
        let list = fiber.contextDependencies;
        let nextFiber;
        if (list) {
            nextFiber = fiber.child;
            let dependency = list.first;
            while(dependency) {
                // 判断是否有和context相match的
                if (dependency === context && dependency.observedBits & changedBits !== 0) {
                    if (fiber.tag === FIBERTAGS.ClassComponent) {
                        let update = createUpdate(null, renderExpirationtime);
                        update.tag = UpdateTags.ForceUpdate;
                        if (fiber.updateQueue) {
                            fiber.updateQueue.addUpdate(update);
                        }
                    }
                    if (fiber.expirationTime < renderExpirationtime) {
                        fiber.expirationTime = renderExpirationtime;
                    }
                    let alternate = fiber.alternate;
                    if (alternate && alternate.expirationTime < renderExpirationtime) {
                        alternate.expirationTime = renderExpirationtime;
                    }
                    scheduleWorkOnParentPath(fiber.return, renderExpirationtime);
                    if (list.expirationTime < renderExpirationtime) {
                        list.expirationTime = renderExpirationtime;
                    }
                    break;
                }
                dependency = dependency.next;
            }
        } else {
            nextFiber = fiber.child;
        }
        if (nextFiber) {
            nextFiber.return = fiber;
        } else {
            nextFiber = fiber;
            while(true) {
                let sibling = nextFiber.sibling;
                if (sibling) {
                    nextFiber = sibling;
                    break;
                } else {
                    nextFiber = nextFiber.return;
                    if (nextFiber === workInProgress || nextFiber === workInProgress.alternate) {
                        nextFiber = null;
                        break;
                    }
                }
            }
        }
        fiber = nextFiber;
    }
    
}

function scheduleWorkOnParentPath(parent, renderExpirationtime) {
    // 更新所有祖先的childExpirationTime
    let node = parent;
    while(node) {
        let alternate = node.alternate;
        if (node.childExpirationTime < renderExpirationtime) {
            node.childExpirationTime = renderExpirationtime;
            if (alternate && alternate.childExpirationTime < renderExpirationtime) {
                alternate.childExpirationTime = renderExpirationtime;
            }
        } else if (alternate && alternate.childExpirationTime < renderExpirationtime) {
            alternate.childExpirationTime = renderExpirationtime;
        } else {
            // 当前节点优先级高于renderExpirationTime，则再往上的都高于，提前终止
            break;
        }
        node = node.return;
    }
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
        } else if (child.child !== null) {
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
    let nextChildren = nextProps && nextProps.children;
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

function updateClassComponent(workInProgress, renderExpirationtime) {
    const current = workInProgress.alternate;
    const ctor = workInProgress.type;
    const getDerivedStateFromProps = ctor.getDerivedStateFromProps;
    let instance = workInProgress.stateNode;
    const contextType = ctor.contextType;
    const props = workInProgress.pengdingProps;
    prepareToReadContext(workInProgress, renderExpirationtime);
    let context = null;
    if (typeof contextType === 'object' && contextType !== null) {
        // 单一context源，contextType
        context = readContext(contextType);
    } else {
        // TODO        
    }
    if (!instance) {
        // 之前没有实例化过，所以需要实例化
        instance = new ctor(props, context);
        workInProgress.stateNode = instance;
        // 也要把fiber节点挂到instance上，方便setState时使用
        instance.updater = new ClassComponentUpdater();
        const componentDidMount = instance.componentDidMount;
        if (typeof componentDidMount === 'function') {
            workInProgress.effectTag |= EffectTags.Update;
        }
    } else {
        // 已经实例化过，处理updateQueue
        const updateQueue = workInProgress.updateQueue;
        const newState = processUpdateQueue(updateQueue, renderExpirationtime);
        workInProgress.updateQueue = null;
        workInProgress.memorizedState = newState;
        instance.state = {
            ...instance.state,
            ...newState,
        };
        instance.context = context;
    }
    instance._reactInternalFiber = workInProgress;
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

function updateFunctionComponent(workInProgress, renderExpirationtime) {
    const current = workInProgress.alternate;
    const props = workInProgress.pendingProps;
    const type = workInProgress.type;
    let children;
    window.currentlyRenderingFiber$1 = workInProgress;
    if (!current) {
        // 首次装载
        window.reactCurrentDispatcher.current = HooksDispatcherOnMount;
        children = type(props);
    } else {
        // 更新
    }
    const renderedWork = currentlyRenderingFiber$1;
    // 每次执行完updateFunctionComponent后，当前函数节点的hooks链表也变成最新的
    renderedWork.memorizedState = window.firstWorkInProgressHook;
    renderedWork.expirationTime = renderExpirationtime;
    // 每次执行时，updateQueue都会变成这次执行过程中产生的最新的
    // 因为由于分支的关系，当前函数可能会在后面需要执行不同的effect
    renderedWork.updateQueue = window.componentUpdateQueue;
    renderedWork.effectTag |= window.sideEffectTag;

    window.currentlyRenderingFiber$1 = null;
    window.firstWorkInProgressHook = null;
    window.workInProgressHook = null;
    window.componentUpdateQueue = null;
    window.effectTag = EffectTags.noWork;

    workInProgress.child = reconcileChildren(current, workInProgress, children);
    return workInProgress.child;
}

function updateHostRoot(workInProgress, renderExpirationtime) {
    const updateQueue = workInProgress.updateQueue;
    const newState = processUpdateQueue(updateQueue, renderExpirationtime);
    workInProgress.updateQueue = null;
    workInProgress.memorizedState = newState;
    workInProgress.child = reconcileChildren(workInProgress.alternate, workInProgress, newState);
    return workInProgress.child;
}

function createFiberNode(type, pendingProps, key) {
    let newFiberNode;
    if (typeof type === 'function') {
        // 函数或者class组件
        if (type.prototype.isReactComponent) {
            // 类组件
            newFiberNode = new FiberNode(FIBERTAGS.ClassComponent, pendingProps, key, type);
        } else {
            // 函数组件
            newFiberNode = new FiberNode(FIBERTAGS.FunctionComponent, pendingProps, key, type);
        }
    } else if (typeof type === 'string') {
        // hostComponent
        newFiberNode = new FiberNode(FIBERTAGS.HostComponent, pendingProps, key, type);
    } else if (typeof type === 'object' && type !== null) {
        // context Provider 或者 context Consumer
        if(type.$$typeof === REACT_PROVIDER_TYPE) {
            newFiberNode = new FiberNode(FIBERTAGS.ContextProvider, pendingProps, key, type);
        } else {
            newFiberNode = new FiberNode(FIBERTAGS.ContextConsumer, pendingProps, key, type);
        }
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
        newFiberNode = createFiberNode(type, pendingProps, key, nextChildren);
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

function performAsyncWork(didTimeout) {
    // 异步reconcile的入口
    // 再计算一次任务是否超时
    requestCurrentTime();
    if (didTimeout || window.currentRendererTime > window.reactRoot.expirationTime) {
        performWorkOnRoot(false);
    } else {
        performWorkOnRoot(true);
    }
}

function performSyncWork() {
    performWorkOnRoot(false)
}

function performWorkOnRoot(isAsync) {

    // 先判断是不是新的任务
    // 如果是新的任务，需要重置相关栈、重新从树顶开始
    if (isAsync && (window.reactRoot.expirationTime !== window.nextRenderExpirationTime || !window.nextUnitOfWork)) {
        window.nextUnitOfWork = createWorkInProgress(window.reactRoot.current, null);
    }
    window.nextRenderExpirationTime = window.reactRoot.expirationTime;
    if (!isAsync) {
        // 同步任务，不能被打断
        while(nextUnitOfWork) {
            nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
        }
    } else {
        while(nextUnitOfWork && window.frameDeadline >= performance.now()) {
            nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
        }
        if (nextUnitOfWork) {
            // 一帧的时间已经用完，但是当前任务还没有执行完成
            // 重新插入到链表中，进行排序
            scheduleCallbackWithExpirationTime(window.nextRenderExpirationTime);
            return;
        }
    }
    // 提交阶段，不能被打断
    // 将Fiber tree映射到页面上
    // 此时的workInProgress就是rootFiber节点了。
    try {
        commit();
    } finally {
        window.reactRoot.expirationTime = workTime.noWork;
    }
}

function performUnitOfWork(workInProgress) {
    let nextUnitOfWork = beginWork(workInProgress, window.nextRenderExpirationTime);
    if (!nextUnitOfWork) {
        // 当前分支已经走到了最后
        // 提交update的结果
        // 并寻找下一个需要update的节点
        nextUnitOfWork = completeUnitofWork(workInProgress);
    }
    return nextUnitOfWork;
}

function renderImp(reactElement, container) {
    // 根据container生成ReactRoot根节点
    const reactRoot = new ReactRoot(container);
    window.reactRoot = reactRoot;
    
    let workInProgress = createWorkInProgress(reactRoot.current, null);
    // root的workInProgress的updateQueue暂时写死
    workInProgress.updateQueue = new UpdateQueue();
    workInProgress.updateQueue.addUpdate(createUpdate(reactElement, workTime.sync));
    window.reactRoot.expirationTime = workInProgress.expirationTime = workTime.sync;
    window.nextUnitOfWork = workInProgress;
    performSyncWork();
}

function render(reactElement, container) {
    window.mode = modeMap.NoContext;
    window.nextRenderExpirationTime = workTime.sync;
    renderImp(reactElement, container);
}

function concurrentRender(reactElement, container) {
    window.mode = modeMap.ConcurrentMode;
    window.nextRenderExpirationTime = workTime.sync;
    renderImp(reactElement, container);
}

function commit() {
    // 将修改一次性提交到页面上
    const root = window.reactRoot;
    const currentrRootFiber = root.current;
    const rootFiber = currentrRootFiber.alternate; // workInProgress tree上的root节点
    let nextEffect = rootFiber.firstEffect;
    const { Placement, Update, Deletion } = EffectTags;
    // commitAllHostEffects
    while (nextEffect) {
        const effectTag = nextEffect.effectTag;
        // 需要预先过滤掉EffectTag中不是下面这三种的部分，因为如果不过滤的话，下面的switch就不会生效了。
        // const primaryEffectTag = effectTag & (Placement | Update | Deletion);
        if (effectTag & Placement) {
            commitPlacement(nextEffect);
            nextEffect.effectTag &= ~Placement;
        }
        if (effectTag & Update) {
            commitUpdateHostEffect(nextEffect);
            nextEffect.effectTag &= ~Update;
        }
        if (effectTag & Deletion) {
            commitDeletion(nextEffect);
            nextEffect.effectTag &= ~Deletion;
        }
        nextEffect = nextEffect.nextEffect;
    }
    // commitAllLifeCycles
    nextEffect = rootFiber.firstEffect;
    while(nextEffect) {
        const effectTag = nextEffect.effectTag;
        if (effectTag & Update) {
            commitUpdateLifeCycles(nextEffect);
            nextEffect.effectTag &= ~Update;
        }
    }
    rootFiber.firstEffect = rootFiber.lastEffect = null;
    // 提交完所有的effect后，要更改workInProgressRoot的current
    window.reactRoot.current = rootFiber;
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

function commitUpdateHostEffect(finishedWork) {
    const updatePayload = finishedWork.updatePayload || [];
    const finishedWorkDomNode = finishedWork.stateNode;

    if (finishedWork.tag === FIBERTAGS.HostComponent) {
        for (let i = 0, length = updatePayload.length; i < length; i += 2) {
            const propName = updatePayload[i];
            const propValue = updatePayload[i + 1];
    
            updateDomProperties(finishedWorkDomNode, propName, propValue);
        }
    } else if (finishedWork.tag === FIBERTAGS.FunctionComponent) {
        // 函数组件，此时只处理layOutEffect
        const updateQueue = finishedWork.updateQueue;
        const lastEffect = updateQueue.lastEffect;
        if (lastEffect) {
            const firstEffect = lastEffect.next;
            let effect = firstEffect;
            while(true) {
                if (effect.tag & HookEffectTags.UnmountMutation !== HookEffectTags.noWork) {
                    // 卸载
                    const destroy = effect.destroy;
                    destroy && destroy();
                    effect.destroy = null;
                }
                if (effect.tag & EffectTags.MountLayout !== EffectTags.noWork) {
                    // 装载/更新
                    const create = effect.create;
                    effect.destroy = create();
                }
                if (effect.next !== firstEffect) {
                    effect = effect.next;
                } else {
                    break;
                }
            }
        }
    }
}

function commitUpdateLifeCycles(finishedWork) {
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
        // 区分mount/update
        instance.componentDidMount();
    } else if (finishedWork.tag === FIBERTAGS.FunctionComponent) {
        // 函数组件，如果有生命周期effect，需要执行生命周期effect
        const updateQueue = finishedWork.updateQueue;
        const lastEffect = updateQueue.lastEffect;
        if (lastEffect) {
            const firstEffect = lastEffect.next;
            let effect = firstEffect;
            while(true) {
                if (effect.tag & EffectTags.UnmountLayout !== EffectTags.noWork) {
                    // 卸载
                    const destroy = effect.destroy;
                    destroy && destroy();
                    effect.destroy = null;
                }
                if (effect.tag & EffectTags.MountLayout !== EffectTags.noWork) {
                    // 装载/更新
                    const create = effect.create;
                    effect.destroy = create();
                }
                if (effect.next !== firstEffect) {
                    effect = effect.next;
                } else {
                    break;
                }
            }
        }
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
            // 事件函数执行前，初始化isBatchingUpdates
            window.isBatchingUpdates = true;
            window.isBatchingInteractiveUpdates = true;
            propValue();
            // 事件函数执行完后，恢复isBatchingUpdates
            window.isBatchingUpdates = false;
            window.isBatchingInteractiveUpdates = false;
            // 执行完事件handler后，如果需要fiber diff，开始执行fiber diff
            if (window.syncQueue) {
                const currentRootFiber = window.syncQueue[0];
                window.syncQueue = null;
                nextUnitOfWork = createWorkInProgress(currentRootFiber, null);
                performSyncWork();
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

function cancelCallback(callbackId) {
    callbackId.next.previous = callbackId.previous;
    callbackId.previous.next = callbackId.next;
    callbackId = null;
}

export function scheduleCallbackWithExpirationTime(expirationTime) {
    // 判断是否在一次的异步内
    if(window.callbackExpirationTime !== workTime.noWork) {
        // 说明这次异步中，已经加入了callbackNode
        // 理论上来讲，同一异步的多个setState的过期时间应该是一样的
        if (window.callbackExpirationTime > expirationTime) {
            // 由于未知原因 ，当前setState的过期时间小于之前setState的时间，直接return
            return;
        } else {
            // 取消之前的callbackNode
            if (window.callbackId) {
                cancelCallback(window.callbackId)
            }
        }
    }
    unstable_scheduleCallback(expirationTime);
}

export function unstable_scheduleCallback(expirationTime) {
    let newCallbackNode = {
        callback: performAsyncWork,
        expirationTime,
    }
    window.callbackId = newCallbackNode;
    // 对新插入的callbackNode进行排序
    // 双向不循环链表
    if (!window.firstCallbackNode) {
        // 链表初始化
        window.firstCallbackNode = newCallbackNode;
    } else {
        // 已经存在链表，需要按照过期时间，插入新的节点
        // 从链表头开始
        // 按照过期时间，从小到大排列
        let firstCallbackNode = window.firstCallbackNode;
        let node = firstCallbackNode;
        while(true) {
            if (node.expirationTime > expirationTime) {
                newCallbackNode.next = node;
                newCallbackNode.previous = node.previous;
                if (node === firstCallbackNode) {
                    window.firstCallbackNode = newCallbackNode;
                } else {
                    node.previous.next = newCallbackNode;
                }
                node.previous = newCallbackNode;
                break;
            }
            next = node.next;
            if (!next) {
                // 已经到链表末尾
                node.next = newCallbackNode;
                newCallbackNode.previous = node;
            }
        }
    }
    // 将firstCallbackNode节点安排到下一帧的idle时间执行
    ensureHostCallbackIsScheduled();
}

function ensureHostCallbackIsScheduled() {
    // 安排firstCallbackNode进idle time
    window.requestAnimationFrame(timeStamp => {
        window.frameDeadline = timeStamp + window.activeFrameTime;
        // 通过messageChannel，保证在帧内的idle时间执行
        window.channel.port2.postMessage(undefined);
    });
}

function flushFirstCallback(didTimeout) {
    const flushedNode = window.firstCallbackNode;
    window.firstCallbackNode = flushedNode.next;
    if (window.firstCallbackNode) {
        window.firstCallbackNode.previous = null;    
    }
    flushedNode.next = null;

    const callback = flushedNode.callback;
    callback(didTimeout);
}



let ReactDom = {
    render,
    concurrentRender,
};

export default ReactDom;