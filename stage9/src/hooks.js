import { requestCurrentTime, computeExpirationForFiber } from "./util.js";
import { workTime, EffectTags } from "./Constant.js";
import { scheduleWork } from "./ClassComponentUpdater.js";

window.firstWorkInProgressHook = null;
window.nextWorkInProgressHook = null;
window.workInProgressHook = null; // hook链表中的最后一个
window.componentUpdateQueue = null;
window.sideEffectTag = EffectTags.noWork;
window.currentHook = null;
window.nextCurrentHook = null;
window.numberOfReRenders = 0;

// 将当前hook添加到当前节点的hook链中
function mountWorkInProgressHook() {
    const hook = {
        memorizedState: null,
        baseState: null,
        queue: null,
        baseUpdate: null,
        next: null,
    }
    if (workInProgressHook === null) {
        // 当前还没有hook
        firstWorkInProgressHook = workInProgressHook = hook;
    } else {
        workInProgressHook = workInProgressHook.next = hook;
    }
    return workInProgressHook;
}

// 从当前节点的hook链中找到当前hook
// 复制一份，再添加到链表中
function updateWorkInProgressHook() {
    if (window.nextWorkInProgressHook) {
        // todo
    } else {
        window.currentHook = window.nextCurrentHook;
        const newHook = {
            memorizedState: currentHook.memorizedState,
            baseState: currentHook.baseState,
            queue: currentHook.queue,
            baseUpdate: currentHook.baseUpdate,
            next: null,
        }
        if (!window.workInProgressHook) {
            workInProgressHook = firstWorkInProgressHook = newHook;
        } else {
            workInProgressHook = workInProgressHook.next = newHook;
        }
        nextCurrentHook = currentHook.next;
    }
    return workInProgressHook;
}

function basicStateReducer(state, action) {
    return typeof action === 'function' ? action(state) : action;
}

function updateReducer(reducer, initialArg) {
    const hook = updateWorkInProgressHook();
    const queue = hook.queue;
    queue.lastRenderReducer = reducer;
    if (window.numberOfReRenders > 0) {
        // todo
    } else {
        const last = queue.last;
        const baseUpdate = hook.baseUpdate;
        const baseState = hook.baseState;
        let first = null;
        if (baseUpdate) {
            // todo
        } else {
            first = last === null ? null : last.next;
        }
        if (first) {
            let newState = baseState;
            let newBaseState = null;
            let newBaseUpdate = null;
            let prevUpdate = baseUpdate;
            let update = first;
            let didSkip = false;
            while(true) {
                let updateExpirationTime = update.expirationTime;
                if (updateExpirationTime < window.nextRenderExpirationTime) {
                    // 没有足够优先级，跳过
                    if (!didSkip) {
                        didSkip = true;
                        newBaseState = newState;
                        newBaseUpdate = prevUpdate;
                    }
                } else {
                    if (update.eagerReducer === reducer) {
                        newState = update.eagerState;
                    } else {
                        newState = reducer(newState, update.action);
                    }
                }
                prevUpdate = update;
                update = update.next;
                if (!update || update === first) {
                    break;
                }
            }
            if (!didSkip) {
                newBaseUpdate = newState; // 最新的state
                newBaseUpdate = prevUpdate; // 记录update链表中最后一个update
            }
            if (newState !== hook.memorizedState) {
                window.didReceiveUpdate = true;
            }
            hook.memorizedState = newState;
            hook.baseUpdate = newBaseUpdate;
            hook.baseState = newBaseUpdate;

            queue.lastRenderState = newState
        }
    }
    let dispatch = queue.dispatch;
    return [hook.memorizedState, dispatch];
}

function dispatchAction(fiber, queue, action) {
    const alternate = fiber.alternate;
    if (fiber === window.currentlyRenderingFiber$1 || alternate !== null && alternate === window.currentlyRenderingFiber$1) {
        // 在当前节点的render阶段，就调用了重新设置state的方法
        // 暂时将这次的update缓存起来。
        // 执行时间待定
        window.didScheduleRenderPhaseUpdate = true;
        const update = {
            expirationTime: window.nextRenderExpirationTime,
            action: action,
            eagerReducer: null,
            eagerState: null,
            next: null,
        }
        if (window.renderPhaseUpdates === null) {
            window.renderPhaseUpdates = new Map();
        }
        let firstRenderPhaseUpdate = window.renderPhaseUpdates.get(queue);
        if (firstRenderPhaseUpdate === undefined) {
            window.renderPhaseUpdates.set(queue, update);
        } else {
            // 添加到链表的最后
            let lastRenderPhaseUpdate = firstRenderPhaseUpdate;
            while(lastRenderPhaseUpdate.next) {
                lastRenderPhaseUpdate = lastRenderPhaseUpdate.next;
            }
            lastRenderPhaseUpdate.next = update;
        }
    } else {
        const currentTime = requestCurrentTime();
        const _expirationTime = computeExpirationForFiber(currentTime, fiber);
        const update = {
            expirationTime: _expirationTime,
            action: action,
            eagerReducer: null,
            eagerState: null,
            next: null
        };
        let last = queue.last;
        if (!last) {
            update.next = update;
        } else {
            let first = last.next;
            if (first) {
                update.next = first;
            }
            last.next = update;
        }
        queue.last = update;
        if (fiber.expirationTime === workTime.noWork || alternate && alternate.expirationTime === workTime.noWork) {
            // 当前fiber节点没有其他任务，可以先判断下state是否发生了变化，如果没有变化。可以直接忽略此次的update
            const lastRenderReducer = queue.lastRenderReducer;
            if (lastRenderReducer) {
                let currentState = queue.lastRenderState;
                const eagerState = lastRenderReducer(currentState, action);
                update.eagerReducer = lastRenderReducer;
                update.eagerState = eagerState;
                if (eagerState === currentState) {
                    return;
                }
            }
        }
        scheduleWork(fiber, _expirationTime);
    }
}

function mountState(initialState) {
    if (typeof initialState === 'function') {
        initialState = initialState();
    }
    const hook = mountWorkInProgressHook();
    hook.memorizedState = hook.baseState = initialState;
    let queue = hook.queue = {
        last: null,
        dispatch: null,
        lastRenderReducer: basicStateReducer,
        lastRenderState: initialState,
    }
    let dispatch = queue.dispatch = dispatchAction.bind(null, window.currentlyRenderingFiber$1, queue);
    return [hook.memorizedState, dispatch];
}

function updateState(initialState) {
    return updateReducer(basicStateReducer, initialState);
}

function mountEffect(create, deps) {
    return mountEffectImpl(EffectTags.Update | EffectTags.Passive, EffectTags.UnmountPassive | EffectTags.MountPassive, create, deps)
}

function updateEffect(create, deps) {
    return updateEffectImpl(workTime.Update | workTime.Passive, workTime.UnmountPassive | workTime.MountPassive, create, deps);
}

function createFunctionComponentUpdateQueue() {
    return {
        lastEffect: null,
    }
}

// 将当前hook的effect加入到fiber节点的updateQueue
function pushEffect(tag, create, destroy, deps) {
    const effect = {
        tag: tag,
        create: create,
        destroy: destroy,
        deps: deps,
        next: null,
    }
    if (window.componentUpdateQueue === null) {
        window.componentUpdateQueue = createFunctionComponentUpdateQueue();
        componentUpdateQueue.lastEffect = effect.next = effect;
    } else {
        const lastEffect = componentUpdateQueue.lastEffect;
        if (!lastEffect) {
            componentUpdateQueue.lastEffect = effect.next = effect;
        } else {
            effect.next = componentUpdateQueue.lastEffect.next;
            componentUpdateQueue.lastEffect.next = effect;
            componentUpdateQueue.lastEffect = effect;
        }
    }
    return effect;
}

function mountEffectImpl(fiberEffectTag, hookEffectTag, create, deps) {
    const hook = mountWorkInProgressHook();
    const nextDeps = deps === undefined ? null : deps;
    window.sideEffectTag |= fiberEffectTag;
    hook.memorizedState = pushEffect(hookEffectTag, create, undefined, deps);
}

function updateEffectImpl(fiberEffectTag, hookEffectTag, create, deps) {
    const hook = updateWorkInProgressHook();
    const nextDeps = deps === undefined ? null : deps;
    let destroy = undefined;
    
    if(window.currentHook) {
        const prevEffect = hook.memorizedState;
        destroy = prevEffect.destroy;
        if (nextDeps !== null) {
            const prevDeps = prevEffect.deps;
            if (areHookInputsEqual(nextDeps, prevDeps)) {
                pushEffect(workTime.noWork, create, destroy, nextDeps);
                return
            }
        }
    }
    window.sideEffectTag |= fiberEffectTag;
    hook.memorizedState = pushEffect(hookEffectTag, create, destroy, nextDeps);
}

function areHookInputsEqual(nextDeps, prevDeps) {
    if (nextDeps.length !== prevDeps.length) {
        return false;
    }
    for (let i = 0; i < prevDeps.length; i++) {
        if (nextDeps[i] !== prevDeps[i]) {
            return false;
        }
    }
    return true;
}



export const HooksDispatcherOnMount = {
    useState: function(initialState) {
        return mountState(initialState);
    },
    useEffect: function(create, deps) {
        return mountEffect(create, deps);
    }
}

export const HooksDispatcherOnUpdate = {
    useState: function(initialState) {
        return updateState(initialState);
    },
    useEffect: function(create, deps) {
        return updateEffect(create, deps);
    }
}