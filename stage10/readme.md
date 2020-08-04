### stage10

#### 目标

实现react-redux

#### 思路

react-redux 是更优雅地将redux应用在react上。
主要的API有
Provider，利用context能够使后代组件获取到store
connect，使组件订阅store。通过this.props就能获取

#### 实施

1、首先实现Provider，将store作为context的value，使后代组件能够获取到
2、实现connect

#### 总结


