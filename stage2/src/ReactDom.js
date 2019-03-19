function render(reactElement, container) {
    const reactElementType = reactElement.type;
    if (typeof reactElementType === 'function') { // class或者function组件
        const Ctor = reactElementType;
        const instance = new Ctor();
        const children = instance.render();
        return render(children, container);
    }
    if (typeof reactElementType === 'string') {
        const domElement = document.createElement(reactElementType);
        const elementprops = reactElement.props;
        const elementConfig = elementprops.config;
        const events = ['onClick', 'onChange'];
        const customStyles = {
            'fontSize': 'font-size',
            'textAlign': 'text-align'
        };

        if (elementConfig) {
            const configKeys = Object.keys(elementConfig);
            configKeys.forEach(configKey => {
                // 判断props里面是否有事件需要绑定
                const configValue = elementConfig[configKey];
                if (events.includes(configKey)) {
                    domElement[configKey.toLowerCase()] = configValue;
                }

                // 判断props里面是否有className需要处理
                if (configKey === 'className') {
                    domElement.setAttribute('class', configValue);
                }

                // 判断props中是否有style需要处理
                if (configKey === 'style') {
                    let styleString = '';
                    for (let styleItem in configValue) {
                        if (configValue.hasOwnProperty(styleItem)) {
                            if (customStyles.hasOwnProperty(styleItem)) {
                                const validStyleName = customStyles[styleItem];
                                customStyles[validStyleName] = configValue[styleItem];
                                styleString += `${validStyleName}: ${configValue[styleItem]};`;
                                delete configValue[styleItem];
                                continue;
                            }
                            styleString += `${styleItem}: ${configValue[styleItem]};`;
                        }
                    }
                    domElement.setAttribute('style', styleString);
                }
            });
        }

        const children = elementprops.children;
        if (typeof children === 'object') {
            render(children, domElement);
        }
        if (typeof children === 'string') {
            domElement.textContent = children;
            container.appendChild(domElement);
            return container;
        }
        container.appendChild(domElement);
    }
}

let ReactDom = {
    render: render
};

export default ReactDom;