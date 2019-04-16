/**
 * 工具函数
 */
import FiberNode from './fiberNode';

export default {
    createWorkInProgress(current, pendingProps) {
        let workInProgress = current.alternate;
        if (workInProgress === null) {
            // 还没有相应的alternate, 需要新生成fiber节点，并保存pendingProps
            workInProgress = new FiberNode(current.tag, pendingProps, current.key, current.type);
            workInProgress.alternate = current;
            current.alternate = workInProgress;
        } else {
            // 已经有alternate，只需要更新pendingProps就行
            workInProgress.pendingProps = pendingProps;
        }
        // 虽然存在workInProgress，但是网络关系可能已经发生变化，所以还是要更新一遍
        workInProgress.elementType = current.elementType;
        workInProgress.stateNode = current.stateNode;

        workInProgress.child = current.child;
        workInProgress.return = current.return;
        workInProgress.sibling = current.sibling;
        workInProgress.index = current.index;

        workInProgress.ref = current.ref;

        workInProgress.memorizedProps = current.memorizedProps;
        workInProgress.memorizedState = current.memorizedState;

        return workInProgress;
    }
};