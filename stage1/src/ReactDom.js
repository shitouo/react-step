const ReactDom = {
    render(reactElement, container) {
        const domElement = document.createElement(reactElement.type);
        domElement.textContent = reactElement.props.children;
        container.appendChild(domElement);
    }
};

export default ReactDom;