import ReactRoot from './reactRoot.js';
import { enqueueSetState } from './classComponentUpdater.js';

function render(reactElement, container) {
    // 根据container生成ReactRoot根节点
    const reactRoot = new ReactRoot(container);
    const CDMStack = window.CDMStack;

    // 根据reactElement递归生成Fiber tree，并插入到reactRoot中
    reactRoot.render(reactElement);
    // 将Fiber tree映射到页面上
    commit(true, reactRoot);
    // 执行组件的CDM函数
    if (CDMStack.getLength() > 0) {
        let instanceItem = CDMStack.pop();
        while (instanceItem) {
            instanceItem.componentDidMount();
            instanceItem = CDMStack.pop();
        }
    }
}

function commit(isInitial, reactRoot) {
    // 将修改一次性提交到页面上
    if (isInitial) {
        // 初次装载
        // 广度优先遍历Fiber tree
        const rootFiber = reactRoot.root;
        let nextFiberNode = rootFiber.child;
        let parentElement = rootFiber.stateNode;
        while (nextFiberNode) {
            const domElement = nextFiberNode.stateNode;
            domElement && parentElement.appendChild(domElement);
            if (nextFiberNode.sibling) {
                nextFiberNode = nextFiberNode.sibling;
            } else if (nextFiberNode.child) {
                parentElement = domElement ? domElement : parentElement;
                nextFiberNode = nextFiberNode.child;
            } else {
                nextFiberNode = null;
            }
        }
        document.body.appendChild(rootFiber.stateNode);
    }
}

let ReactDom = {
    render,
    enqueueSetState
};

export default ReactDom;