/**
 * class component updater
 */
import { createUpdate } from './util.js';
import UpdateQueue from './UpdateQueue.js';
import { workTime } from './Constant.js';

window.syncQueue = null;

function scheduleWorkToRoot(instance) {
    // 向上 一直到找到root节点
    const fiber = instance._reactInternalFiber;
    let node = fiber;
    while (true) {
        if (node.return) {
            node = node.return
        } else {
            return node;
        }
    }
}

class ClassComponentUpdater{
    enqueueSetState(instance, partialState, callback) {
        const fiber = instance._reactInternalFiber;
        const update = createUpdate(partialState);
        if (!fiber.updateQueue) {
            fiber.updateQueue = new UpdateQueue();
        }
        fiber.updateQueue.addUpdate(update);
        // 给当前节点的过期时间置为需要update
        fiber.expirationTime = workTime.sync;
        const rootFiber = scheduleWorkToRoot(instance);
        if (!window.syncQueue) {
            window.syncQueue = [rootFiber];
        }
    }
}

export default ClassComponentUpdater;