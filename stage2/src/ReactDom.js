function render(reactElement, container) {
    const domElement = document.createElement(reactElement.type);
    domElement.textContent = reactElement.props.children;
    container.appendChild(domElement);
}

let ReactDom = {
    render: render
};

export default ReactDom;