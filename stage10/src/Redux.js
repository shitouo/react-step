function randomString() {
    return Math.random().toString(36).substring(7).split('').join('.');
};

const ActionTypes = {
    INIT: `@@redux/INIT${randomString}`,
}

class Store {
    constructor(reducer, preloadedState) {
        this.currentReducer = reducer;
        this.currentState = preloadedState;
        this.nextListeners = [];
        this.isDispatching = false;
        // this.dispatch({
        //     type: ActionTypes.INIT,
        // })
    }
    getState() {
        if (this.isDispatching) {
            throw new Error('You may not call store.getState() while the reducer is executing. ' + 'The reducer has already received the state as an argument. ' + 'Pass it down from the top reducer instead of reading it from the store.');
        }
        return this.currentState;
    }
    subscribe(listener) {
        if (typeof listener !== 'function') {
            throw new Error('listener 必须是函数');
        }
        if (this.isDispatching) {
            throw new Error('You may not call store.subscribe() while the reducer is executing. ' + 'If you would like to be notified after the store has been updated, subscribe from a ' + 'component and invoke store.getState() in the callback to access the latest state. ' + 'See https://redux.js.org/api-reference/store#subscribelistener for more details.')
        }
        let isSubscribe = true;
        this.nextListeners.push(listener);
        const unsubscribe = () => {
            if (!isSubscribe) {
                return false;
            }
            if (this.isDispatching) {
                throw new Error('You may not unsubscribe from a store listener while the reducer is executing. ' + 'See https://redux.js.org/api-reference/store#subscribelistener for more details.');
            };
            isSubscribe = false;
            let index = this.nextListeners.findIndex(item => item === listener);
            this.nextListeners.splice(index, 1);
        }
        return unsubscribe;
    }
    dispatch(action) {
        if (!action) {
            throw new Error('action不能为空')
        }
        if (typeof action.type === 'undefined') {
            throw new Error('action必须要有type')
        }
        if (this.isDispatching) {
            throw new Error('Reducers may not dispatch actions.');
        }
        try {
            this.isDispatching = true;
            this.currentState = this.currentReducer(this.currentState, action);
        } finally {
            this.isDispatching = false;
        }
        // state tree发生变化，要调用listeners
        let listeners  = this.nextListeners;
        listeners.forEach(listener => {
            listener();
        });
        return action;
    }
}

// Creates a Redux store that holds the state tree.
// The only way to change the data in the store is to call `dispatch()` on it.
// 要注意如何实现state tree只能通过dispatch修改
export const createStore = (reducer, preloadedState) => {
    return new Store(reducer, preloadedState);
}