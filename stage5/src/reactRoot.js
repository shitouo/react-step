import FiberNode from './fiberNode.js';
import { FIBERTAGS, EFFECTTAGS } from './Constant.js';
import Stack from './stack.js';
import { createWorkInProgress } from './util.js';

// 全局变量
window.CDMStack = new Stack();

function reconcileChildren(current, workInProgress, nextChildren) {
    // 目标是根据reactElement nextChildren返回child fiber
    // 解析nextChildren, 这里只是比较elementType是否发生了变化，如果变化了，则以nextChildren为准，生成新的fiber节点，不用管之前的current.child。如果没有发生变化，则以current.child为蓝本，生成新的fiber节点，并绑定两者的alternate关系
    const childrenElementType = nextChildren.type;
    const childrenElementProps = nextChildren.props;
    const childrenElementKey = nextChildren.key;
    const prevChildFiber = current.child;
    if (prevChildFiber.elementType !== childrenElementType) {
        // 如果type不一致，说明发生了重大的变化，则直接以nextChildren为准，生成新的fiber节点即可，不用再考虑current.child了。
        let newFiberNode = null;
        if (typeof childrenElementType === 'function') {
            // class组件或者函数组件
            // TODO 这里要区分函数组件还是类组件。现在统一按照类组件来处理，先不考虑函数组件
            newFiberNode = new FiberNode(FIBERTAGS.ClassComponent, childrenElementProps, childrenElementKey, childrenElementType);
            // eslint-disable-next-line
            const instance = new childrenElementType();
            // 关联instance和fiber节点，方便互相访问
            instance._reactInternalFiber = newFiberNode;
            newFiberNode.stateNode = instance;
            children = instance.render();
            // 检查组件是否有CDM函数
            if (instance.componentDidMount) {
                window.CDMStack.push(instance);
            }
        } else if (typeof childrenElementType === 'string') {
            newFiberNode = new FiberNode(FIBERTAGS.HostComponent, childrenElementProps, childrenElementKey, childrenElementType);
            // 对于元素类型的，这里先生成要装入到页面的元素
            newFiberNode.stateNode = createDomElement(childrenElementType, childrenElementProps);
        }
    }else {
        // 没有重大变化，以current.child为蓝本，复制childFiber就好
        newFiberNode = createWorkInProgress(currentElement, currentElement.pendingProps);
    }
    // 设置当前节点的父节点
    newFiberNode.return = workInProgress;
    
    return newFiberNode;
}

function updateClassComponent(current, workInProgress) {
    // 解析classComponent就是要比较instance的props和states是否发生了变化，
    // 还需要调用render函数
    // 对比props、states是否发生了变化
    const oldProps = workInProgress.memorizedProps;
    const newProps = workInProgress.pendingProps;
    const oldState = workInProgress.memorizedState;
    const instance = workInProgress.stateNode;
    const newState = instance.state;
    if (oldProps !== newProps || oldState !== newState) {
        workInProgress.effectTag |= EFFECTTAGS.Update;
    }
    const nextChildren = instance.render();
    workInProgress.child = reconcileChildren(current, workInProgress, nextChildren);
    return workInProgress.child;
}

function updateHostComponent() {
    // 
}

function createDomElement(elementType, elementProps) {
    const domElement = document.createElement(elementType);
    const elementConfig = elementProps.config;
    const events = ['onClick', 'onChange'];
    const customStyles = {
        'fontSize': 'font-size',
        'textAlign': 'text-align'
    };

    if (elementConfig) {
        const configKeys = Object.keys(elementConfig);
        configKeys.forEach(configKey => {
            // 判断props里面是否有事件需要绑定
            const configValue = elementConfig[configKey];
            if (events.includes(configKey)) {
                domElement[configKey.toLowerCase()] = configValue;
            }

            // 判断props里面是否有className需要处理
            if (configKey === 'className') {
                domElement.setAttribute('class', configValue);
            }

            // 判断props中是否有style需要处理
            if (configKey === 'style') {
                let styleString = '';
                for (let styleItem in configValue) {
                    if (configValue.hasOwnProperty(styleItem)) {
                        if (customStyles.hasOwnProperty(styleItem)) {
                            const validStyleName = customStyles[styleItem];
                            customStyles[validStyleName] = configValue[styleItem];
                            styleString += `${validStyleName}: ${configValue[styleItem]};`;
                            delete configValue[styleItem];
                            continue;
                        }
                        styleString += `${styleItem}: ${configValue[styleItem]};`;
                    }
                }
                domElement.setAttribute('style', styleString);
            }
        });
    }

    // 处理字符串类型的children
    const children = elementProps.children;
    if (typeof children === 'string') {
        domElement.textContent = children;
    }
    return domElement;
}

function getChildFiber(currentElement, parentFiberNode, isUpdate) {
    if (!currentElement) {
        return null;
    }
    if (isUpdate) {
        // 更新过程
        // 这里没有办法使用DFS，因为fiber tree更像是一个链表
        // TODO 后面要把这里和下面合在一起
        const nextFiber = currentElement;
        const workInProgressFiber = createWorkInProgress()
        const nextChildren = next

        
    }
    // 深度优先遍历，生成Fiber tree
    const currentElementType = currentElement.type;
    const currentElementProps = currentElement.props;
    const currentElementKey = currentElement.key;
    let children = currentElementProps && currentElementProps.children;
    let newFiberNode = null;
    if (typeof currentElementType === 'function') {
        // class组件或者函数组件
        // TODO 这里要区分函数组件还是类组件。现在统一按照类组件来处理，先不考虑函数组件
        newFiberNode = new FiberNode(FIBERTAGS.ClassComponent, currentElementProps, currentElementKey, currentElementType);
        // eslint-disable-next-line
        const instance = new currentElementType();
        // 关联instance和fiber节点，方便互相访问
        instance._reactInternalFiber = newFiberNode;
        newFiberNode.stateNode = instance;
        children = instance.render();
        // 检查组件是否有CDM函数
        if (instance.componentDidMount) {
            window.CDMStack.push(instance);
        }
    } else if (typeof currentElementType === 'string') {
        newFiberNode = new FiberNode(FIBERTAGS.HostComponent, currentElementProps, currentElementKey, currentElementType);
        // 对于元素类型的，这里先生成要装入到页面的元素
        newFiberNode.stateNode = createDomElement(currentElementType, currentElementProps);
    }
    // 设置当前节点的父节点
    newFiberNode.return = parentFiberNode;
    // 判断children是否需要递归
    if (children) {
        // reactElment的children分为数组、reactElement对象、字符串
        const childrenType = typeof children;
        if (Array.isArray(children)) {
            const fiberNodes = children.map(childElement => {
                return getChildFiber(childElement, newFiberNode);
            });
            newFiberNode.child = fiberNodes[0];
            fiberNodes.forEach((item, index) => {
                item.sibling = fiberNodes[index + 1];
                if (index === fiberNodes.length - 1) {
                    item.sibling = null;
                }
            });
        } else if (childrenType === 'object') {
            newFiberNode.child = getChildFiber(children, newFiberNode);
        } else if (childrenType === 'string') {
            // 如果是字符串，不用生成Fiber节点
            newFiberNode.child = children;
        }
    }
    return newFiberNode;
}

class ReactRoot {
    constructor(container) {
        this.rootFiber = new FiberNode(FIBERTAGS.HostRoot, null, null, null);
        this.rootFiber.stateNode = this;
        this.containerInfo = container;
    }

    // 生成Fiber tree
    render(reactElement) {
        if (!reactElement) {
            // 没有传reactElement，说明是更新
            let current = this.rootFiber.child;
            let workInProgress = createWorkInProgress(current);
            let nextWorkInProgress = workInProgress;
            while (nextWorkInProgress) {
                const nextWorkInProgressTag = nextWorkInProgress.tag;
                if (nextWorkInProgressTag === FIBERTAGS.ClassComponent) {
                    nextWorkInProgress = updateClassComponent(nextWorkInProgress);
                } else if (nextWorkInProgressTag === FIBERTAGS.HostComponent) {
                    nextWorkInProgress = updateHostComponent();
                }
                if (!nextWorkInProgress) {
                    // child走到底了，需要返回看sibling
                    const sibling = nextWorkInProgress.sibling;
                    if (sibling) {
                        nextWorkInProgress = sibling;
                        continue;
                    }
                    while (true) {
                        let parentSibling = nextWorkInProgress.return.sibling;
                        if (parentSibling) {
                            nextWorkInProgress = parentSibling;
                            break;
                        } else {
                            nextWorkInProgress = nextWorkInProgress.return;
                            if (nextWorkInProgress === this.rootFiber) {
                                // 遍历完成
                                break;
                            }
                        }
                    }
                }
            }
        } else {
            // 初始装载
            this.rootFiber.child = getChildFiber(reactElement, this.rootFiber);
        }
    }
}

export default ReactRoot;