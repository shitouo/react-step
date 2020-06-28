import FiberNode from './FiberNode.js';
import { FIBERTAGS } from './Constant.js';
import Stack from './stack.js';
import { createWorkInProgress } from './WorkInProgress.js';

// 全局变量
window.CDMStack = new Stack();



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

class ReactRoot {
    constructor(container) {
        this.root = new FiberNode(FIBERTAGS.HostRoot, null, null, null);
        this.root.stateNode = container;
    }

    // 生成Fiber tree
    render(reactElement) {
        function getChildFiber(currentElement, parentFiberNode) {
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
        this.root.child = getChildFiber(reactElement, this.root);
    }
}

export default ReactRoot;