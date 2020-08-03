import FiberNode from './FiberNode.js';
import { EffectTags } from './Constant.js';

export function createWorkInProgress(currentFiberNode, pendingProps) {
    let workInProgress = currentFiberNode.alternate;
    if (!workInProgress) {
        workInProgress = new FiberNode(currentFiberNode.tag, pendingProps, currentFiberNode.key, currentFiberNode.type);
        workInProgress.alternate = currentFiberNode;
        currentFiberNode.alternate = workInProgress;
    } else {
        // 当前节点的workInProgress已经被创建过，只需要更新动态属性即可
        workInProgress.pendingProps = pendingProps;
        // 重置
        // 不然会遗留上次diff的结果
        workInProgress.effectTags = EffectTags.NoEffect;
        workInProgress.firstEffect = null;
        workInProgress.lastEffect = null;
        workInProgress.nextEffect = null;
    }
    workInProgress.elementType = currentFiberNode.elementType;
    workInProgress.stateNode = currentFiberNode.stateNode;
    workInProgress.mode = currentFiberNode.mode;
    
    workInProgress.child = currentFiberNode.child;
    workInProgress.sibling = currentFiberNode.sibling;
    
    workInProgress.index = currentFiberNode.index;
    workInProgress.ref = currentFiberNode.ref;
    workInProgress.memorizedProps = currentFiberNode.memorizedProps;
    workInProgress.memorizedState = currentFiberNode.memorizedState;
    workInProgress.expirationTime = currentFiberNode.expirationTime;
    workInProgress.updateQueue = currentFiberNode.updateQueue;
    return workInProgress;
}