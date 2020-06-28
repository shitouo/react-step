### stage5

#### 目标

这个阶段的目标是要实现setState函数，更新我们的页面。

#### 思路

在调用setState之后，我们会将新的state放到当前classComponent的fiber节点的updateQueue中。
然后在后面从root节点开始重新构建fiber tree时，再对updateQueue进行处理
我们不能在每次调用setState时就直接进行fiber tree的构建和diff。这样在连续setState时，可以节约性能.
所以我们要考虑的一点就是，如何在事件执行完毕后，发起构建和diff fiber tree的流程。
所以，react在这里，实现了自己的事件监听和触发系统。得对原生的dom事件做一层代理，由我们去决定什么时候触发事件，以及触发事件后该做什么。
总结下我们要实现的目的：1. 在setState被调用后，要执行fiber diff。2. 但是不能一调用setState，就发起fiber diff。同时调用多次setState，只执行一次fiber diff。
实现方案：1. setState时，将update对象插入到当前fiber节点后，定时一段再执行fiber tree。如果有新的setState执行，则清除上一次的定时。执行新的定时。但是定时并不是很精准。而且只有一次setState时，又凭白等一段时间再执行fiber diff，不是很理想。2. 
实现思路：


#### 实施


#### 总结