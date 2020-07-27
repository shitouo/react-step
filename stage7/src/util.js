const MaxSigned31BitInt = 1073741823;
const Sync = MaxSigned31BitInt;
const MAGIC_NUMBER_OFFSET = MaxSigned31BitInt - 1;
import { modeMap, workTime } from './Constant.js';

export function createUpdate(payload, expirationTime) {
    return {
        payload,
        expirationTime,
    }
}

export function msToExpirationTime(ms) {
    return MAGIC_NUMBER_OFFSET - (ms / 10 | 0);
}

export function expirationTimeToMs(expirationTime) {
    return (MAGIC_NUMBER_OFFSET - expirationTime) * 10;
}

export function requestCurrentTime() {
    let currentTimeMs = performance.now();
    if (window.callbackExpirationTime !== workTime.noWork) {
        // 如果在同一个异步里面，则返回同样的时间
        return window.currentRendererTime;
    }
    window.currentSchedulerTime = window.currentRendererTime = msToExpirationTime(currentTimeMs);
    return window.currentSchedulerTime;
}

export function computeExpirationForFiber(currentTime, fiber) {
    if (fiber.mode === modeMap.ConcurrentMode) {
        if (window.isBatchingInteractiveUpdates) {
            return computeInteractiveExpiration(currentTime);
        } else {
            // 异步
            return computeAsyncExpiration(currentTime);
        }
    } else {
        return Sync;
    }
}

export function computeInteractiveExpiration(currentTime) {
    const HIGH_PRIORITY_EXPIRATION = 500;
    const HIGH_PRIORITY_BATCH_SIZE = 100;
    return computeExpirationBucket(currentTime, HIGH_PRIORITY_EXPIRATION, HIGH_PRIORITY_BATCH_SIZE);
}

export function computeAsyncExpiration(currentTime) {
    const LOW_PRIORITY_EXPIRATION = 5000;
    const LOW_PRIORITY_BATCH_SIZE = 250;
    return computeExpirationBucket(currentTime, LOW_PRIORITY_EXPIRATION, LOW_PRIORITY_BATCH_SIZE);
}

export function computeExpirationBucket(currentTime, expirationInMs, bucketSizeMs) {
    return MAGIC_NUMBER_OFFSET - ((((MAGIC_NUMBER_OFFSET - currentTime + expirationInMs / 10) / bucketSizeMs) | 0) + 1) * (bucketSizeMs / 10)
}