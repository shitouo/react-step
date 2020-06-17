/**
 * FiberNode类
 * 用来生产Fiber节点
 */
class FiberNode {
    constructor(tag, pendingProps, key, type) {
        // instance
        this.tag = tag; // fiber节点的类型
        this.key = key;
        this.type = type; // reactElement对象的type
        this.elementType = null;
        this.stateNode = null;

        // fiber
        this.return = null;
        this.child = null;
        this.sibling = null;
        this.index = 0;

        this.ref = null;

        this.pendingProps = pendingProps;
        this.memorizedProps = null;
        this.memorizedState = null;
    }
}

export default FiberNode;