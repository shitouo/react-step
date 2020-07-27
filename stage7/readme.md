### stage7

#### 目标

这个阶段的目标是，实现react-hooks

#### 思路

首先要考虑函数式组件是怎样渲染的
然后考虑，在函数式组件渲染的过程中，怎样模拟生命周期，和怎样触发组件更新

考虑是不是可以仿照类组件，维护自己的state，当hooks修改state时，内部调用setState。但是这样感觉也只是hack而已，而react官方的思路是慢慢去掉类组件。所以这里就需要研究下了。

函数组件，processUpdate的时候，也是发生在updateFunctionComponent时，只不过对于类组件来讲，是从updateQueue中，找出最后的state。而函数组件是hook.queue中找到最后的state值并返回。函数组件的所有hook是一个链表。
memorizedState存储的是第一个stateful的hook

#### 实施

1. 函数式组件渲染

#### 总结
