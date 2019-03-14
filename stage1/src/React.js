/**
 * React对象
 */
const React = {
    createElement: function(type, config, children) {
        // 根据所传入的type，config，生成相应的reactElement
        return {
            type,
            key: config && config.key,
            ref: config && config.ref,
            props: { config, children },
        };
    }
};

export default React;