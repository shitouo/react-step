import FiberNode from './FiberNode';
import { EffectTags } from './Constant';

export function createWorkInProgress(currentFiberNode, pendingProps) {
    let newFiberNode = null;
    const workInProgress = currentFiberNode.alternate;
    if (!workInProgress) {
        newFiberNode = cloneFiberNode(currentFiberNode);
        newFiberNode.pendingProps = pendingProps;
        newFiberNode.alternate = currentFiberNode;
        currentFiberNode.alternate = newFiberNode;
    } else {
        // 当前节点的workInProgress已经被创建过，只需要更新动态属性即可
        workInProgress.pendingProps = pendingProps;
        workInProgress.effectTags = EffectTags.NoEffect;
        workInProgress.firstEffect = null;
        workInProgress.lastEffect = null;
        workInProgress.nextEffect = null;
    }
}

export function cloneFiberNode(fiberNode) {
    const newFiberNode = new FiberNode(fiberNode.tag, fiberNode.pendingProps, fiberNode.key, fiberNode.type);
    newFiberNode.elementType = fiberNode.elementType;
    newFiberNode.stateNode = fiberNode.stateNode;

    newFiberNode.return = fiberNode.return;
    newFiberNode.child = fiberNode.child;
    newFiberNode.sibling = fiberNode.sibling;

    newFiberNode.index = fiberNode.index;
    newFiberNode.ref = fiberNode.ref;
    newFiberNode.memorizedProps = fiberNode.memorizedProps;
    newFiberNode.memorizedState = fiberNode.memorizedState;

    return newFiberNode;
}