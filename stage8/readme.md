### stage7

#### 目标

这个阶段的目标是，实现context机制

#### 思路

1. 首先是context对象的创建，context对象会有一个Provider的属性，用来标识当前组件的children都可能是这个context的消费者。
2. 子组件的静态属性，contextType表示这个组件，需要消费context，并且也指明了要消费哪个context。
3. 对于要消费context的组件，向上找到context。并且将当前context的值当做props传给当前的组件
4. 所以关键点在于怎样向上找到context了。

#### 实施

1. 实现createContext API
2. contextType静态属性
3. 找到context

#### 总结

context是独立于父子组件传递数据的一个 第三者数据。任何想获取这个数据的组件，都需要使用contextType或者context.Consumer来获取。未通过这两种方式的组件，是获取不到在这部分数据的。即便其父组件可能已经获取过。
context变化后，会强制provider后代中所有使用了这个context的组件进行重新渲染。所以这也是要考虑性能的地方。
