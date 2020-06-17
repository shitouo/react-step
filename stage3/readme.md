### stage3

#### 目标

构建Fiber tree，并能够根据Fiber tree渲染页面。

#### 思路

我们在上一个阶段，实现了根据我们设定的初始值，渲染出我们想要的页面。但是数据不是一成不变的，我们希望数据在发生变化的时候，页面也相应地发生变化。
数据变化时，我们的页面跟着变化，大概想一下，应该很简单。只要在数据发生变化时，我们再调用一下我们组件的render函数，然后把结果再插入到页面中就OK了。这种方式在小的应用上是可以的，但是如果应用大了，如果只是因为一个数据变了，就要重新渲染整个页面，这肯定是不合理的。所以我们就要考虑一种方式，能够让我们最小范围地、精准地去更新我们的页面。
在React16之前，react一直靠stack reconciler来实现这个需求，stack reconciler就是我们熟知的virtual dom及dom diff机制。但是在react16之后，react实现了一种新的机制，叫做Fiber reconciler。关于这两者的区别，网上已经有很多文章介绍了，我们这里就不再多说，我们直接开始构建Fiber reconciler体系。

首先，我们需要根据ReactDOM.render参数中的container来创建ReactRoot，这是我们的根节点
然后，再根据ReactDom.render参数中的element来递归生成Fiber Tree，采用的是 深度优先的先序遍历
最后，我们再来考虑，如何根据Fiber Tree来渲染我们想要页面。

#### 总结
