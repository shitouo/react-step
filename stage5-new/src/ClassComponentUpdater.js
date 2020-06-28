/**
 * class component updater
 */
import { createUpdate } from './util.js';
import UpdateQueue from './UpdateQueue';

window.syncQueue = null;

function scheduleWorkToRoot(instance) {
    // 向上 一直到找到root节点
    const fiber = instance._reactInternalFiber;
    let node = fiber.return;
    while (node) {
        node = node.return;
    }
    return node;
}

class ClassComponentUpdater{
    enqueueSetState(instance, partialState, callback) {
        const fiber = instance._reactInternalFiber;
        const update = createUpdate(partialState);
        if (!fiber.udpateQueue) {
            fiber.udpateQueue = new UpdateQueue();
        }
        fiber.udpateQueue.addUpdate(update);
        const rootFiber = scheduleWorkToRoot(instance);
        if (!window.syncQueue) {
            window.syncQueue = [rootFiber];
        }
    }
}

export default ClassComponentUpdater;