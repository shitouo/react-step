/**
 * React对象
 */
import { REACT_ELEMENT_TYPE } from './Constant.js';

class Component {
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
            props: { config, children },
        };
    },
    Component: Component
};

export default React;