/**
 * React对象
 */
import { REACT_ELEMENT_TYPE, REACT_CONTEXT_TYPE, REACT_PROVIDER_TYPE } from './Constant.js';

window.reactCurrentDispatcher = {
    current: null,
}

class Component {
    constructor(props, context) {
        this.props = props;
        this.context = context;
    }
    get isReactComponent() {
        return {};
    }
    setState(partialState, callback) {
        this.updater && this.updater.enqueueSetState(this, partialState, callback);
    }
}

const React = {
    // 根据所传入的type，config，生成相应的reactElement
    createElement: function(type, config, ...rest) {
        // 这里要处理下children，因为实际的children可能有多个对象，也有可能是一个对象，也有可能知识一个字符串
        const childrenLength = rest.length;
        let children = null;
        if (childrenLength === 1) {
            children = rest[0];
        } else if (childrenLength >= 2) {
            children = rest;
        }

        return {
            type,
            $$typeof: REACT_ELEMENT_TYPE,
            key: config && config.key,
            ref: config && config.ref,
            props: { ...config, children },
        };
    },
    Component: Component,
    useState: function(initialState) {
        const dispatcher = window.reactCurrentDispatcher.current;
        if (!dispatcher) {
            throw error('未找到dispatcher');
        }
        dispatcher.useState(initialState);
    },
    useEffect: function(create, deps) {
        const dispatcher = window.reactCurrentDispatcher.current;
        if (!dispatcher) {
            throw error('未找到dispatcher');
        }
        dispatcher.useEffect(create, deps);
    },
    useLayoutEffect: function() {
        const dispatcher = window.reactCurrentDispatcher.current;
        if (!dispatcher) {
            throw error('未找到dispatcher');
        }
        dispatcher.useLayoutEffect(create, deps);
    },
    useMemo: function(create, inputs) {
        const dispatcher = window.reactCurrentDispatcher.current;
        if (!dispatcher) {
            throw error('未找到dispatcher');
        }
        dispatcher.useMemo(create, inputs);
    },
    useReducer: function(reducer, initialArg, init) {
        const dispatcher = window.reactCurrentDispatcher.current;
        if (!dispatcher) {
            throw error('未找到dispatcher');
        }
        dispatcher.useReducer(reducer, initialArg, init);
    },
    createContext: function(defaultValue, calculateChangeBits) {
        if (!calculateChangeBits) {
            calculateChangeBits = null;
        }
        const context = {
            $$typeof: REACT_CONTEXT_TYPE,
            _calculateChangeBits: calculateChangeBits,
            _currentValue: defaultValue,
            _currentValue2: defaultValue,
            _threadCount: 0,
            Provider: null,
            Consumer: null,
        }
        context.Provider = {
            $$typeof: REACT_PROVIDER_TYPE,
            _context: context,
        }

        context.Consumer = {
            $$typeof: REACT_CONTEXT_TYPE,
            _context: context,
            _calculateChangeBits: context._calculateChangeBits,
        }

        return context;
    }
};

export default React;