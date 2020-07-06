### stage5

#### 目标

这个阶段的目标是要实现fiber 的可打断和可恢复机制。

#### 思路

unstable_scheduleCallback
问题1. workInProgerss记录的是当前解析的节点。可以找到。但是这个节点是处于创建workInProgress tree阶段还是回溯阶段，这个不清楚。
问题2. 时间调度机制是react本身的。在web和RN中都会有用到，所以时间调度的功能应该是写在React中的。
问题3. 不同屏幕和设备的屏幕刷新率是不一样的。所以还要能够自调整每帧的时长。

时间调度机制是通过window.requestIdleCallbak来实现的。但是这个API的兼容性很差，所以需要通过requestAnimationFrame来模拟。

整个系统中用的时间，和我们实际的时间没有任何关系。这是浏览器自己的计时工具，精度可打到微妙

1单位的expiration time 等于 10ms，事件发生的时间每推迟10ms，优先级上就会减少1。

两个机制，idlleCaback保证每一帧后都退出当前执行栈，

#### 实施

1. 实现用requestAnimationCallback来模拟requestIdleCallback
2. 实现自适应屏幕刷新率
3. 

#### 总结
