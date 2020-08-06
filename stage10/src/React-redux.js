import React from './React.js';

const ReactReduxContext = React.createContext(null);

const nullListeners = {
    notify: function notify() {},
}

function createListenerCollection() {
    let first = null;
    let last = null;
    return {
        clear: function() {
            first = null;
            last = null;
        },
        notify: function() {
            let listener = first;
            while(listener) {
                listener.callback();
                listener = listener.next;
            }
        }
    }
}

class Subscription {
    constructor(store) {
        this.store = store;
        this.unsubscribe = null;
        this.listeners = nullListeners;
    }
    notifyNestedSubs() {
        this.listeners.notify();
    }
    handleChangeWrapper() {
        this.onStateChange && this.onStateChange();
    }
    trySubscribe() {
        if (!this.unsubscribe) {
            // 当store发生变化时，最终会调用this.listeners.notify()
            this.unsubscribe = this.store.subscribe(this.handleChangeWrapper);
            this.listeners = createListenerCollection();
        }
    }
    tryUnSubscribe() {
        if (this.unsubscribe) {
            this.unsubscribe();
            this.unsubscribe = null;
            this.listeners.clear();
            this.listeners = nullListeners;
        }
    }
}

export function Provider(props) {
    const {store, context, children} = props;
    const contextValue = React.useMemo(function() {
        let subscription = new Subscription(store);
        subscription.onStateChange = subscription.notifyNestedSubs;
        return {
            store,
            subscription,
        }
    }, [store]);
    const previousState = React.useMemo(function() {
        return store.getState();
    }, [store]);
    React.useEffect(function() {
        let subscription = contextValue.subscription;
        subscription.trySubscribe();
        if (previousState !== store.getState()) {
            subscription.notifyNestedSubs();
        }
        return function() {
            subscription.tryUnSubscribe();
            subscription.onStateChange = null;
        }
    }, [contextValue, previousState]);
    let Context = context || ReactReduxContext;
    return React.createElement(Context.Provider, {
        value: contextValue,
    }, children);
}

function _objectWithoutPropertiesLoose(source, excluded) {
    if (!source) {
        return null;
    }
    let sourceKeys = Object.keys(source);
    let result = {};
    for (let i = 0; i < sourceKeys.length; i++) {
        let key = sourceKeys[i];
        if (excluded.includes(key)) {
            continue;
        } else {
            result[key] = source[key];
        }
    }
    return result;
}

function storeStateUpdatesReducer(state, action) {
    let updateCount = state[1];
    return [action.payload, updateCount + 1];
}

function initStateUpdate() {
    return [null, 0];
}

var useIsomorphicLayoutEffect = typeof window !== 'undefined' && typeof window.document !== 'undefined' && typeof window.document.createElement !== 'undefined' ? React.useLayoutEffect : React.useEffect;

function useIsomorphicLayoutEffectWithArgs(effectFunc, effectArgs, dependencies) {
    useIsomorphicLayoutEffect(function () {
      return effectFunc.apply(void 0, effectArgs);
    }, dependencies);
}

function captureWrapperProps(lastWrapperProps, lastChildProps, renderIsScheduled, wrapperProps, actualChildProps, childPropsFromStoreUpdate, notifyNestedSubs) {
    // We want to capture the wrapper props and child props we used for later comparisons
    lastWrapperProps.current = wrapperProps;
    lastChildProps.current = actualChildProps;
    renderIsScheduled.current = false; // If the render was from a store update, clear out that reference and cascade the subscriber update

    if (childPropsFromStoreUpdate.current) {
      childPropsFromStoreUpdate.current = null;
      notifyNestedSubs();
    }
}

// 订阅store的变化
function subscribeUpdates(shouldHandleStateChanges, store, subscription, childPropsSelector, lastWrapperProps, lastChildProps, renderIsScheduled, childPropsFromStoreUpdate, notifyNestedSubs, forceComponentUpdateDispatch) {
    // If we're not subscribed to the store, nothing to do here
    if (!shouldHandleStateChanges) return;

    var didUnsubscribe = false;
    var lastThrownError = null; // We'll run this callback every time a store subscription update propagates to this component

    var checkForUpdates = function checkForUpdates() {
      if (didUnsubscribe) {
        // Don't run stale listeners.
        // Redux doesn't guarantee unsubscriptions happen until next dispatch.
        return;
      }

      var latestStoreState = store.getState();
      var newChildProps, error;

      try {
        // Actually run the selector with the most recent store state and wrapper props
        // to determine what the child props should be
        newChildProps = childPropsSelector(latestStoreState, lastWrapperProps.current);
      } catch (e) {
        error = e;
        lastThrownError = e;
      }

      if (!error) {
        lastThrownError = null;
      } // If the child props haven't changed, nothing to do here - cascade the subscription update


      if (newChildProps === lastChildProps.current) {
        if (!renderIsScheduled.current) {
          notifyNestedSubs();
        }
      } else {
        // Save references to the new child props.  Note that we track the "child props from store update"
        // as a ref instead of a useState/useReducer because we need a way to determine if that value has
        // been processed.  If this went into useState/useReducer, we couldn't clear out the value without
        // forcing another re-render, which we don't want.
        lastChildProps.current = newChildProps;
        childPropsFromStoreUpdate.current = newChildProps;
        renderIsScheduled.current = true; // If the child props _did_ change (or we caught an error), this wrapper component needs to re-render

        forceComponentUpdateDispatch({
          type: 'STORE_UPDATED',
          payload: {
            error: error
          }
        });
      }
    }; // Actually subscribe to the nearest connected ancestor (or store)


    // 当store变化后，会执行checkForUpdates
    subscription.onStateChange = checkForUpdates;
    subscription.trySubscribe(); // Pull data from the store after first render in case the store has
    // changed since we began.

    checkForUpdates();

    var unsubscribeWrapper = function unsubscribeWrapper() {
      didUnsubscribe = true;
      subscription.tryUnsubscribe();
      subscription.onStateChange = null;

      if (lastThrownError) {
        // It's possible that we caught an error due to a bad mapState function, but the
        // parent re-rendered without this component and we're about to unmount.
        // This shouldn't happen as long as we do top-down subscriptions correctly, but
        // if we ever do those wrong, this throw will surface the error in our tests.
        // In that case, throw the error from here so it doesn't get lost.
        throw lastThrownError;
      }
    };

    return unsubscribeWrapper;
}

function hoistNonReactStatics_cjs(targetComponent, sourceComponent, blacklist) {
    if (typeof sourceComponent !== 'string') {
        // don't hoist over string (html) components

        if (Object.prototype) {
            var inheritedComponent = Object.getPrototypeOf(sourceComponent);
            if (inheritedComponent && inheritedComponent !== Object.prototype) {
                hoistNonReactStatics(targetComponent, inheritedComponent, blacklist);
            }
        }

        var keys = Object.getOwnPropertyNames(sourceComponent);

        if (Object.getOwnPropertySymbols) {
            keys = keys.concat(Object.getOwnPropertySymbols(sourceComponent));
        }

        var targetStatics = getStatics(targetComponent);
        var sourceStatics = getStatics(sourceComponent);

        for (var i = 0; i < keys.length; ++i) {
            var key = keys[i];
            if (!KNOWN_STATICS[key] && !(blacklist && blacklist[key]) && !(sourceStatics && sourceStatics[key]) && !(targetStatics && targetStatics[key])) {
                var descriptor = getOwnPropertyDescriptor(sourceComponent, key);
                try {
                    // Avoid failures from read-only properties
                    defineProperty(targetComponent, key, descriptor);
                } catch (e) {}
            }
        }

        return targetComponent;
    }

    return targetComponent;
}

function connectAdvanced(selectorFactory, _ref = {}) {
    const {
        getDisplayName = function(name) { return `ConnectAdvanced(${name})` },
        methodName = 'connectAdvanced',
        renderCountProp = undefined,
        shouldHandleStateChange = true,
        storeKey = 'store',
        withRef = false,
        forwardRef = false,
        context = ReactReduxContext,
    } = _ref;
    const connectOptions = _objectWithoutPropertiesLoose(_ref, ['getDisplayName', 'methodName', 'renderCountProp', 'shouldHandleStateChange', 'storeKey', 'withRef', 'forwardRef', 'context']);
    let Context = context;
    // 下面的函数就是connect返回的那个高阶组件
    // 这个函数，会根据出入的组件，返回一个新的组件
    // 新组件的child是我们的业务组件，但是传给我们业务组件的props上，会带上store的state和dispatch，还有引用组件地方预先设置的那些ownProps
    return function wrapWithConnect(WrappedComponent) {
        let wrappedComponentName = WrappedComponent.displayName || WrappedComponent.name || 'Component';
        let displayName = getDisplayName(wrappedComponentName);
        let selectorFactoryOptions = {
            ...connectOptions,
            ...{
                getDisplayName,
                methodName,
                renderCountProp,
                shouldHandleStateChange,
                storeKey,
                displayName,
                wrappedComponentName,
                WrappedComponent,
            }
        }
        const pure = connectOptions.pure;
        const usePureOnlyMemo = pure ? React.useMemo : function(callback) {
            callback();
        }

        function createChildSelector(store) {
            return selectorFactory(store.dispatch, selectorFactoryOptions);
        }
        // 最后实际使用的组件，是个函数组件
        function ConnectFunction(props) {
            // 我们不能让用户感受到有这层组件的存在
            // 但是原来组件的props上面却神奇般的有了store上的state和dispatch
            // 这里的props是在我们在调用这个组件时，传递的props
            const [ propsContext, reactReduxForwardedRef, wrapperProps ] = React.useMemo(function() {
                const reactReduxForwardedRef = props.reactReduxForwardedRef;
                const wrapperProps = _objectWithoutPropertiesLoose(props, ['reactReduxForwardedRef']);
                return [props.context, reactReduxForwardedRef, wrapperProps];
            }, [props]);
            const contextValue = React.useContext(Context);
            const store = contextValue.store;
            const childPropsSelector = React.useMemo(function() {
                return createChildSelector(store)
            }, [store]);
            const [subscription, notifyNestedSubs] = React.useMemo(function() {
                if (!shouldHandleStateChange) {
                    return [null, null];
                }
                let subscription = new Subscription(store, contextValue.subscription);
                let notifyNestedSubs = subscription.notifyNestedSubs.bind(subscription);
                return [subscription, notifyNestedSubs];
            }, [store, contextValue]);
            const overriddenContextValue = React.useMemo(function() {
                return {
                    ...contextValue,
                    ... {
                        subscription,
                    }
                }
            }, [contextValue, subscription]);
            const [_useReducer$, previousStateUpdateResult, forceComponentUpdateDispatch] = React.useReducer(storeStateUpdatesReducer, [], initStateUpdate);
            let lastChildProps = React.useRef();
            let lastWrapperProps = React.useRef(wrapperProps);
            let childPropsFromStoreUpdate = React.useRef();
            let renderIsScheduled = React.useRef(false);
            // 我们业务组件同state、dispatch混合后的props
            let actualChildProps = usePureOnlyMemo(function() {
                // wrapperProps 业务组件原来的props，还都要原封不动地传下去

                // if (childPropsFromStoreUpdate.current && wrapperProps === lastWrapperProps.current) {
                //     return childPropsFromStoreUpdate.current;
                // }
                
                // childPropsSelector 默认是 pureFinalPropsSelector
                return childPropsSelector(store.getState(), wrapperProps);
            }, [store, previousStateUpdateResult, wrapperProps]);

            // useIsomorphicLayoutEffectWithArgs(captureWrapperProps, [lastWrapperProps, lastChildProps, renderIsScheduled, wrapperProps, actualChildProps, childPropsFromStoreUpdate, notifyNestedSubs]);
            
            // 添加订阅store的handler
            React.useLayoutEffect(function() {
                subscribeUpdates(shouldHandleStateChange, store, subscription, childPropsSelector, lastWrapperProps, lastChildProps, renderIsScheduled, childPropsFromStoreUpdate, notifyNestedSubs, forceComponentUpdateDispatch)
            }, [store, subscription, childPropsSelector]);

            // 当前函数组件的child，就是我们实际编写的那个业务组件
            // 值得关注的就是这个actualChildProps
            let renderedWrappedComponent = React.useMemo(function () {
                return React.createElement(WrappedComponent, {
                    ...actualChildProps,
                    ... {
                        ref: reactReduxForwardedRef
                    }
                }, [reactReduxForwardedRef, WrappedComponent, actualChildProps]);
            }, [reactReduxForwardedRef, WrappedComponent, actualChildProps]);
            // 如果监听了store，就用Provider再包裹一层
            let renderedChild = React.useMemo(function () {
                if (shouldHandleStateChanges) {
                  return React.createElement(Context.Provider, {
                    value: overriddenContextValue
                  }, renderedWrappedComponent);
                }
    
                return renderedWrappedComponent;
              }, [ContextToUse, renderedWrappedComponent, overriddenContextValue]);
            return renderedChild;
        }
        let Connect = pure ? React.memo(ConnectFunction) : ConnectFunction;
        Connect.WrappedComponent = WrappedComponent;
        Connect.displayName = displayName;
        if (forwardRef) {
            let forwarded = React.forwardRef(function forwardConnectRef(props, ref) {
                return React.createElement(Connect, {
                    ...props,
                    ...{
                        reactReduxForwardedRef: ref
                    }
                })
            });
            forwarded.displayName = displayName;
            forwarded.WrappedComponent = WrappedComponent;
            return hoistNonReactStatics_cjs(forwarded, WrappedComponent);
        }
        return hoistNonReactStatics_cjs(Connect, WrappedComponent);
    };
}

function getDependsOnOwnProps(mapToProps) {
    return mapToProps.dependsOnOwnProps !== null && mapToProps.dependsOnOwnProps !== undefined ? Boolean(mapToProps.dependsOnOwnProps) : mapToProps.length !== 1;
}

function wrapMapToPropsFunc(mapToProps) {
    return function initProxySelector(dispatch, _ref) {
        let proxy = function mapToPropsProxy(stateOrDispatch, ownProps) {
            return proxy.dependsOnOwnProps ? proxy.mapToProps(stateOrDispatch, ownProps) : proxy.mapToProps(stateOrDispatch);
        }
        proxy.dependsOnOwnProps = true;
        proxy.mapToProps = function detectFactoryAndVerify(stateOrDispatch, ownProps) {
            proxy.mapToProps = mapToProps;
            proxy.dependsOnOwnProps = getDependsOnOwnProps(mapToProps);
            let props = proxy(stateOrDispatch, ownProps);
            if (typeof props === 'function') {
                proxy.mapToProps = props;
                proxy.dependsOnOwnProps = getDependsOnOwnProps(props);
                props = proxy(stateOrDispatch, ownProps);
            }
            return props;
        };
        return proxy;
    };
}

function wrapMapToPropsConstant(getConstant) {
    return function initConstantSelector(dispatch, actions) {
        let constant = getConstant(dispatch, actions);
        function constantSelector() {
            return constant;
        }
        constantSelector.dependsOnOwnProps = false;
        return constantSelector;
    }
}

function whenMapStateToPropsIsFuntion(mapStateToProps) {
    return typeof mapStateToProps === 'function' ? wrapMapToPropsFunc(mapStateToProps) : undefined;
}

function whenMapStateToPropsIsMissing(mapStateToProps) {
    return !mapStateToProps ? wrapMapToPropsConstant(function() {
        return {};
    }) : undefined;
}

const defaultMapStateToPropsFactories = [whenMapStateToPropsIsFuntion, whenMapStateToPropsIsMissing];

function whenMapDispatchToPropsIsFunction(mapDispatchToProps) {
    return typeof mapDispatchToProps === 'function' ? wrapMapToPropsFunc(mapDispatchToProps) : undefined;
}

function whenMapDispatchToPropsIsMissing(mapDispatchToProps) {
    return !mapDispatchToProps ? wrapMapToPropsConstant(function(dispatch) {
        return {
            dispatch,
        };
    }) : undefined;
}

const defaultMapDispatchToPropsFactories = [whenMapDispatchToPropsIsFunction, whenMapDispatchToPropsIsMissing];

function wrapMergePropsFunc(mergeProps) {
    return function initMergePropsProxy(dispatch, _ref) {
        const { displayName, pure, areMergedPropsEqual } = _ref;
        let hasRunOnce = false;
        let mergedProps;
        return function mergePropsProxy(stateProps, dispatchProps, ownProps) {
            let nextMergedProps = mergeProps(stateProps, dispatchProps, ownProps);
            if (hasRunOnce) {
                if (!pure || !areMergedPropsEqual(nextMergedProps, mergeProps)) {
                    mergeProps = nextMergedProps;
                }
            } else {
                hasRunOnce = true;
                mergedProps = nextMergedProps;
            }
            return mergedProps;
        }
    }
}

function whenMergePropsIsFunction(mergeProps) {
    return typeof mergeProps === 'function' ? wrapMergePropsFunc(mergeProps) : undefined;
}

// 一般情况下，都不会传递mergeProps。所以，基本使用的都是这个默认的
function defaultMergeProps(stateProps, dispatchProps, ownProps) {
    return {
        ...ownProps,
        ...stateProps,
        ...dispatchProps,
    }
}

function whenMergePropsIsOmitted(mergeProps) {
    return !mergeProps ? function () {
        return defaultMergeProps;
    } : undefined;
}

const defaultMergeRropsFactories = [whenMergePropsIsFunction, whenMergePropsIsOmitted];

function imPureFinalPropsSelectorFactory(mapStateToProps, mapDispatchToProps, mergeProps, dispatch) {
    return function imPureFinalPropsSelector(state, ownProps) {
        return mergeProps(mapStateToProps(state, ownProps), mapDispatchToProps(dispatch, ownProps), ownProps);
    }
}

function pureFinalPropsSelectorFactory(mapStateToProps, mapDispatchToProps, mergeProps, dispatch, _ref) {
    const { areStatesEqual, areOwnPropsEqual, areStatePropsEqual, } = _ref;
    let hasRunAtLeastOnce = false;
    let state;
    let ownProps;
    let stateProps;
    let dispatchProps;
    let mergedProps;

    function handleNewPropsAndNewState() {
        stateProps = mapStateToProps(state, ownProps);
        if(mapDispatchToProps.dependsOnOwnProps) {
            dispatchProps = mapDispatchToProps(dispatch, ownProps);
        }
        mergedProps = mergeProps(stateProps, dispatchProps, ownProps);
        return mergedProps;
    }

    function handleNewProps() {
        if (mapStateToProps.dependsOnOwnProps) {
            stateProps = mapStateToProps(state, ownProps);
        }
        if (mapDispatchToProps.dependsOnOwnProps) {
            dispatchProps = mapDispatchToProps(dispatch, ownProps);
        }
        mergedProps = mergeProps(stateProps, dispatchProps, ownProps);
        return mergedProps;
    }

    function handleNewState() {
        let nextStateProps = mapStateToProps(state, ownProps);
        let statePropsChanged = !areStatePropsEqual(nextStateProps, stateProps);
        stateProps = nextStateProps;
        if (statePropsChanged) {
            mergedProps = mergeProps(stateProps, dispatchProps, ownProps);
        }
        return mergedProps;
    }

    function handleSubsequentCalls(nextState, nextOwnProps) {
        let propsChanged = areOwnPropsEqual(nextOwnProps, ownProps);
        let stateChanged = areStatesEqual(nextState, state);
        state = nextState;
        ownProps = nextOwnProps;
        if (propsChanged && stateChanged) {
            return handleNewPropsAndNewState();
        }
        if (propsChanged) {
            return handleNewProps();
        }
        if (stateChanged) {
            return handleNewState();
        }
        return mergedProps;
    }

    function handleFirstCall(firstState, firstOwnProps) {
        state = firstState;
        ownProps = firstOwnProps;
        stateProps = mapStateToProps(state, ownProps);
        dispatchProps = mapDispatchToProps(dispatch, ownProps);
        mergedProps = mergeProps(stateProps, dispatchProps, ownProps);
        hasRunAtLeastOnce = true;
        return mergedProps;
    }

    return function pureFinalPropsSelector(nextState, nextOwnProps) {
        // nextState指的是store
        // nextOwnProps指的是调用我们connect后的组件时，传的props
        return hasRunAtLeastOnce ? handleSubsequentCalls(nextState, nextOwnProps) : handleFirstCall(nextState, nextOwnProps);
    }
}

function finalPropsSelectorFactory(dispatch, _ref2) {
    const { initMapStateToProps, initMapDispatchToProps, initMergeProps } = _ref2;
    const options = _objectWithoutPropertiesLoose(_ref2, ['initMapStateToProps', 'initMapDispatchToProps', 'initMergeProps']);
    let mapStateToProps = initMapStateToProps(dispatch, options);
    let mapDispatchToProps = initMapDispatchToProps(dispatch, options);
    let mergeProps = initMergeProps(dispatch, options);

    let selectorFactory = options.pure ? pureFinalPropsSelectorFactory : imPureFinalPropsSelectorFactory;
    return selectorFactory(mapStateToProps, mapDispatchToProps, mergeProps, dispatch, options);
}

function strictEuqal(a, b) {
    return a === b;
}

function shallowEqual(objA, objB) {
    if (objA === objB) {
        return true;
    }
    if (typeof objA !== 'object' || !objA || typeof objB === 'object' || !objB) {
        return false;
    }
    const keysOfA = Object.keys(objA);
    const keysOfB = Object.keys(objB);
    if (keysOfA.length !== keysOfB.length) {
        return false;
    }
    for (let i = 0; i < keysOfA.length; i++) {
        const key = keysOfA[key];
        if (Object.prototype.hasOwnProperty.call(objA, key)) {
            if (objA[key] !== objB[key]) {
                return false;
            }
        }
    }
    return true;
}

function match(arg, factories, name) {
    for (let i = factories.length - 1; i >= 0; i--) {
        let result = factories[i](arg);
        if (result) {
            return result;
        }
    }
}

function createConnect(_temp = {}) {
    const {
        connectHoc = connectAdvanced,
        mapStateToPropsFactories = defaultMapStateToPropsFactories,
        mapDispatchToPropsFactories = defaultMapDispatchToPropsFactories,
        mergePropsFactories = defaultMergeRropsFactories,
        selectorFactory = finalPropsSelectorFactory,
    } = _temp;
    return function connect(mapStateToProps, mapDispatchToProps, mergeProps, _ref2 = {}) {
        const {
            pure = true,
            areStatesEqual = strictEuqal,
            areOwnPropsEqual = shallowEqual,
            areStatePropsEqual = shallowEqual,
            areMergedPropsEqual = shallowEqual,
        } = _ref2;
        const extraOptions = _objectWithoutPropertiesLoose(_ref2, ['pure', 'areStatesEqual', 'areOwnPropsEqual', 'areStatePropsEqual', 'areMergedPropsEqual']);
        let initMapStateToProps = match(mapStateToProps, mapStateToPropsFactories, 'mapStateToProps'); // initProxySelector
        let initMapDispatchToProps = match(mapDispatchToProps, mapDispatchToPropsFactories, 'mapDispatchToPrpos'); // initProxySelector
        let initMergeProps = match(mergeProps, mergePropsFactories, 'mergeProps'); // initProxySelector
        // connectHoc运行的结果就是connect返回的那个高阶组件
        return connectHoc(selectorFactory, {
            ...{
                methodName: 'connect',
                getDisplayName: function getDisplayName(name) {
                    return `Connect(${name})`;
                },
                shouldHandleStateChange: Boolean(mapStateToProps),
                initMapStateToProps,
                initMapDispatchToProps,
                initMergeProps,
                pure,
                areStatesEqual,
                areOwnPropsEqual,
                areStatePropsEqual,
                areMergedPropsEqual
            },
            ...extraOptions,
        })
    }
}

export const connect = createConnect()