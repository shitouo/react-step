module.exports = {
    extends: [
        'eslint-config-alloy',
    ],
    globals: {
        // 这里填入你的项目需要的全局变量
        // 这里值为 false 表示这个全局变量不允许被重新赋值，比如：
        //
        // jQuery: false,
        // $: false
        document: false, // 浏览器环境
        location: false,
        window: false,
        React: false, // 基础工具库
        ReactDOM: false,
        antd: false,
        moment: false, // 时间日期处理库
        _: false, // lodash
        smartui: false, // 智慧 UI 库
        uilib: false, // 自定义 UI 库
        smart: false, // 智慧引擎
        workInProgress,
        workInProgressRoot
    },
    rules: {
        'no-throw-literal': ['warn'],
        'no-unused-vars': ['warn'],
        'no-param-reassign': ['warn'],
        'no-undefined': ['warn'],
        // 这里填入你的项目需要的个性化配置，比如：
        //
        // // @fixable 一个缩进必须用两个空格替代
        // 'indent': [
        //     'error',
        //     2,
        //     {
        //         SwitchCase: 1,
        //         flatTernaryExpressions: true
        //     }
        // ]
    }
  };