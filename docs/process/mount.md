相信你一定使用过`componentDidMount`与`componentDidUpdate`生命周期钩子，了解他们各自调用的时机。

正因为他们调用的时机不同，在源码层面他们也会执行不同的操作。所以在接下来两节中，我们深入源码讨论在这两个阶段分别发生了什么。

## mount的定义

组件在什么情况下会`mount`呢？

1. 首屏渲染，此时整棵组件树会`mount`。比如调用`ReactDOM.render`方法。
2. 用户交互或其他原因使某个组件`mount`。比如用户打开一个弹窗，弹窗组件`mount`。

为什么要将`mount`和`update`区分开呢？

当组件`mount`时，`Reconciler`需要做的工作是告诉`Renderer`：`mount`的组件对应的`Fiber`内保存了这些`DOM`操作。`Renderer`会依次将这些操作执行到页面上。

而`update`时，`Reconciler`需要将**本次更新的组件**和**上一次更新时生成的`Fiber`树**进行对比，将对比结果生成新的`Fiber`树，`Renderer`会将新`Fiber`内保存的`DOM操作`执行到页面上。

## Reconciler的工作流程

我们之前讲到`Scheduler - Reconciler - Renderer`的架构，现在讲`mount`时为什么先聊`Reconciler`的工作流程呢？原因有三:

1. `Scheduler`负责任务调度（注：在`React`中，从状态改变到页面渲染这之间发生的事称为一次**任务**），这是个独立的部分，我们后面会讲到。

2. `Renderer`负责执行DOM操作（注：我们这里针对的是`ReactDOM`），相对逻辑简单。

3. `mount`和`update`的大部分工作发生在`Reconciler`中

