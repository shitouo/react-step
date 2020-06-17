/**
 * React对象
 */
import Constant from './Constant';

class Component {
    // noop
}

const React = {
    createElement: function(type, config, ...children) {
        // 根据所传入的type，config，生成相应的reactElement
        if (children) {
            if (children.length === 1) {
                children = children[0];
            }
        }
        return {
            type,
            $$typeof: Constant.REACT_ELEMENT_TYPE,
            key: config && config.key,
            ref: config && config.ref,
            props: { config, children },
        };
    },
    Component: Component
};

export default React;