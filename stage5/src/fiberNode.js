/**
 * fiberNode类
 * 用来生产Fiber节点
 */
import { EFFECTTAGS } from './Constant.js'

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

        // effects
        this.effectTag = EFFECTTAGS.NoEffect;
        this.nextEffect = null;
        this.firstEffect = null;
        this.lastEffet = null;

        this.alternate = null;
    }
}

export default FiberNode;