## stage1

### 一、目标
实现jsx到ui的功能

### 二、重点
理解jsx是怎样编译为js能理解的对象的

### 三、思路

想要实现jsx到UI的目标，我们会经过三个主要的部分

 1. 编译jsx，提取出我们需要的信息。
 2. 根据提取出的信息，生成相应的dom对象
 3. 将生成的dom对象插入到页面中。

### 四、实现

#### 1、编译jsx，提取出我们需要的信息

编译jsx，我们可以通过babel实现。react官方也是使用的babel。babel给我们提供了两种方案：

- 我们可以直接在浏览器环境通过babel进行jsx的编译，但是这种方法，会使浏览器变慢，影响用户的体验。所以可以作为学习使用，生产环境不建议使用。
- 我们还可以通过babel，对jsx进行预处理，提前将jsx都编译为`React.createElement(通过jsx提取出的信息)`，而我们要做的工作就是在.babelrc里指明我们接收jsx提取信息的函数，然后执行babel命令就行。
下面是React.createElement代码：

```
// React.js
const React = {
    createElement: function(type, config, children) {
        // 根据所传入的type，config，生成相应的reactElement
        return {
            type,
            key: config && config.key,
            ref: config && config.ref,
            props: { config, children },
        };
    },
    Component: Component
};
```


#### 2、根据提取出的信息，生成DOM节点

以最简单的例子为例。

```
ReactDom.render(<h1>content</h1>, document.getElementById('container'));
```

这里我们要的是ReactDom的render函数

```
// ReactDOM.js
const ReactDom = {
    render(reactElement, container) {
        const domElement = document.createElement(reactElement.type);
        domElement.textContent = reactElement.props.children;
    }
};
```

#### 3、将生成的DOM节点添加到页面

最后一步很简单，在ReactDom.render的最后一行添加上

```
container.appendChild(domElement);
```

就行。

到这里，第一步就完成了。这里我们主要是清楚，jsx是通过babel来编译为我们需要的信息的，当然，除了babel还有其他工具可以使用，这里就不叙述了。而且，关于babel是如何编译的，那就是AST那些知识点了，也不叙述了。
