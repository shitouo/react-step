import ReactRoot from './reactRoot.js';

function render(reactElement, container) {
    // 根据container生成ReactRoot。
    // 注意 reactRoot并不是Fiber节点。它是整个应用的根。记录一些和DOM联系的信息
    const reactRoot = new ReactRoot(container);

    // 根据reactElement递归生成Fiber tree
    reactRoot.render(reactElement);
    commit(true, reactRoot);
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
    }
}

let ReactDom = {
    render: render
};

export default ReactDom;