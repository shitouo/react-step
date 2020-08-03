### stage7

#### 目标

实现redux

#### 思路

redux对外暴露了四个非常重要的API，createStore, subscribe, getState, dispatch
我们的目标就是实现这四个API
createStore接收reducer，并且存储这个reducer，然后在dispatch时候会执行。
然后return出一个store实例，这个实例上有subscribe、getState、dispatch这三个方法
subscribe接收一个函数，每当在store发生变化的时候，就会调用
getState会返回当前的store
dispatch接收一个action对象，type来标识是什么action，然后调用reducer，修改store

#### 实施

1、实现createStore
2、实现subscript、dispatch、getState三个API

#### 总结

**redux本身实现的其实只是 观察者模式 和 单向数据流**
将redux作为第三方，react实现数据管理已经可以完成了。
react-redux只是结合react的context，使实现变得更加优雅，不用我们每个组件自己去调用react的store的api。
