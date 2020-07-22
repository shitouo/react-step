/**
 * class component updater
 */
import { createUpdate, requestCurrentTime, computeExpirationForFiber, expirationTimeToMs } from './util.js';
import UpdateQueue from './UpdateQueue.js';
import { workTime } from './Constant.js';
import { scheduleCallbackWithExpirationTime } from './ReactDom.js';

window.syncQueue = null;

function scheduleWorkToRoot(instance, expirationTime) {
    // 向上 一直到找到root节点
    const fiber = instance._reactInternalFiber;
    let node = fiber;
    if (!window.reactRoot.expirationTime || window.reactRoot.expirationTime < expirationTime) {
        window.reactRoot.expirationTime = expirationTime;
    }
    if (node.expirationTime < expirationTime) {
        node.expirationTime = expirationTime;
    }
    while (true) {
        if (node.return) {
            node = node.return
            if (node.childExpirationTime < expirationTime) {
                node.childExpirationTime = expirationTime;
            }
        } else {
            return node;
        }
    }
}

class ClassComponentUpdater{
    enqueueSetState(instance, partialState, callback) {
        const fiber = instance._reactInternalFiber;
        const currentTime = requestCurrentTime();
        const expirationTime = computeExpirationForFiber(currentTime, fiber);
        const update = createUpdate(partialState, expirationTime);
        if (!fiber.updateQueue) {
            fiber.updateQueue = new UpdateQueue();
        }
        fiber.updateQueue.addUpdate(update);
        fiber.expirationTime = expirationTime;
        const rootFiber = scheduleWorkToRoot(instance, expirationTime);
        if (!window.syncQueue && window.isBatchingUpdates) {
            window.syncQueue = [rootFiber];
        }
        if (!window.isBatchingUpdates) {
            // 异步环境，要向调度器中加入回调任务
            scheduleCallbackWithExpirationTime(expirationTime);
        }
    }
}

export default ClassComponentUpdater;