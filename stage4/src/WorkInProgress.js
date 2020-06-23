import FiberNode from './FiberNode.js';
import { EffectTags } from './Constant.js';

export function createWorkInProgress(currentFiberNode, pendingProps) {
    let workInProgress = currentFiberNode.alternate;
    if (!workInProgress) {
        workInProgress = cloneFiberNode(currentFiberNode);
        workInProgress.pendingProps = pendingProps;
        workInProgress.alternate = currentFiberNode;
        currentFiberNode.alternate = workInProgress;
    } else {
        // 当前节点的workInProgress已经被创建过，只需要更新动态属性即可
        workInProgress.pendingProps = pendingProps;
        workInProgress.effectTags = EffectTags.NoEffect;
        workInProgress.firstEffect = null;
        workInProgress.lastEffect = null;
        workInProgress.nextEffect = null;
    }
    return workInProgress;
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