/**
 * class component updater
 */
import { createWorkInProgress } from './util.js';

function scheduleWorkToRoot(inst) {
    // 向上 一直到找到root节点
    const fiber = inst._reactInternalFiber;
    let node = fiber.return;
    while (node) {
        node = node.return;
    }
    return node;
}

const classComponentUpdater = {
    // 处理setState
    enqueueSetState(inst) {
        // 找到当前Fiber tree的root节点
        const rootFiber = scheduleWorkToRoot(inst);
        // clone 当前rootFiber
        const newRootFiber = createWorkInProgress(rootFiber);
        // 构建新的Fiber tree，并完成diff
        newRootFiber.stateNode.render();
    }
};

export default classComponentUpdater;