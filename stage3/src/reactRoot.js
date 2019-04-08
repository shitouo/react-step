import FiberNode from './fiberNode.js';
import { FIBERTAGS } from './Constant.js';

class ReactRoot {
    constructor(container) {
        this.root = new FiberNode(FIBERTAGS.HostRoot, null, null, null);
        this.root.stateNode = container;
    }

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
            } else if (typeof currentElementType === 'string') {
                newFiberNode = new FiberNode(FIBERTAGS.HostComponent, currentElementProps, currentElementKey, currentElementType);
            }
            // 设置当前节点的父节点
            newFiberNode.return = parentFiberNode;
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