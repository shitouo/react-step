/**
 * fiberNode类
 * 用来生产Fiber节 点
 */
import { EffectTags } from './Constant.js'
class FiberNode {
    constructor(tag, pendingProps, key, type) {
        // instance
        this.tag = tag; // fiber节点的类型
        this.key = key;
        this.type = type; // reactElement对象的type
        this.elementType = null;
        this.stateNode = null;
        this.alternate = null;

        // fiber
        this.return = null;
        this.child = null;
        this.sibling = null;
        this.index = 0;

        this.ref = null;

        this.pendingProps = pendingProps;
        this.memorizedProps = null;
        this.memorizedState = null;
        this.effectTag = EffectTags.NoEffect;
        this.firstEffect = null;
        this.lastEffect = null;
        this.nextEffect = null;
        this.expirationTime = 0;
    }
}

export default FiberNode;