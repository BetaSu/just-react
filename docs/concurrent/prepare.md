在[ReactDOM.render](../state/reactdom.html#react%E7%9A%84%E5%85%B6%E4%BB%96%E5%85%A5%E5%8F%A3%E5%87%BD%E6%95%B0)一节我们介绍了`React`当前的三种入口函数。日常开发主要使用的是`Legacy Mode`（通过`ReactDOM.render`创建）。

从[React v17.0 正式发布！](https://mp.weixin.qq.com/s/zrrqldzRbcPApga_Cp2b8A)一文可以看到，`v17.0`没有包含新特性。究其原因，`v17.0`主要的工作在于源码内部对`Concurrent Mode`的支持。所以`v17`版本也被称为“垫脚石”版本。

你可以从官网[Concurrent 模式介绍](https://zh-hans.reactjs.org/docs/concurrent-mode-intro.html)了解其基本概念。

一句话概括：

> Concurrent 模式是一组 React 的新功能，可帮助应用保持响应，并根据用户的设备性能和网速进行适当的调整。

`Concurrent Mode`是`React`过去2年重构`Fiber架构`的源动力，也是`React`未来的发展方向。

可以预见，当`v17`完美支持`Concurrent Mode`后，`v18`会迎来一大波基于`Concurrent Mode`的库。

底层基础决定了上层`API`的实现，接下来让我们了解下，`Concurrent Mode`自底向上都包含哪些组成部分，能够发挥哪些能力？

## 底层架构 —— Fiber架构

从[设计理念](../preparation/idea.html)我们了解到要实现`Concurrent Mode`，最关键的一点是：实现异步可中断的更新。

基于这个前提，`React`花费2年时间重构完成了`Fiber`架构。

`Fiber`架构的意义在于，他将单个`组件`作为`工作单元`，使以`组件`为粒度的“异步可中断的更新”成为可能。

## 架构的驱动力 —— Scheduler

如果我们同步运行`Fiber`架构（通过`ReactDOM.render`），则`Fiber`架构与重构前并无区别。

但是当我们配合`时间切片`，就能根据宿主环境性能，为每个`工作单元`分配一个`可运行时间`，实现“异步可中断的更新”。

于是，[scheduler](https://github.com/facebook/react/tree/master/packages/scheduler)（调度器）产生了。

## 架构运行策略 —— lane模型

到目前为止，`React`可以控制`更新`在`Fiber`架构中运行/中断/继续运行。

基于当前的架构，当一次`更新`在运行过程中被中断，过段时间再继续运行，这就是“异步可中断的更新”。

当一次`更新`在运行过程中被中断，转而重新开始一次新的`更新`，我们可以说：后一次`更新`打断了前一次`更新`。

这就是`优先级`的概念：后一次`更新`的`优先级`更高，他打断了正在进行的前一次`更新`。

多个`优先级`之间如何互相打断？`优先级`能否升降？本次`更新`应该赋予什么`优先级`？

这就需要一个模型控制不同`优先级`之间的关系与行为，于是`lane`模型诞生了。

## 上层实现

现在，我们可以说：

> 从源码层面讲，Concurrent Mode是一套可控的“多优先级更新架构”。

那么基于该架构之上可以实现哪些有意思的功能？我们举几个例子：

### batchedUpdates

如果我们在一次事件回调中触发多次`更新`，他们会被合并为一次`更新`进行处理。

如下代码执行只会触发一次`更新`：

```js
onClick() {
  this.setState({stateA: 1});
  this.setState({stateB: false});
  this.setState({stateA: 2});
}
```

这种合并多个`更新`的优化方式被称为`batchedUpdates`。

`batchedUpdates`在很早的版本就存在了，不过之前的实现局限很多（脱离当前上下文环境的`更新`不会被合并）。

在`Concurrent Mode`中，是以`优先级`为依据对更新进行合并的，使用范围更广。

### Suspense

[Suspense](https://zh-hans.reactjs.org/docs/concurrent-mode-suspense.html)可以在组件请求数据时展示一个`pending`状态。请求成功后渲染数据。

本质上讲`Suspense`内的组件子树比组件树的其他部分拥有更低的`优先级`。

### useDeferredValue

[useDeferredValue](https://zh-hans.reactjs.org/docs/concurrent-mode-reference.html#usedeferredvalue)返回一个延迟响应的值，该值可能“延后”的最长时间为`timeoutMs`。

例子：

```js
const deferredValue = useDeferredValue(value, { timeoutMs: 2000 });
```

在`useDeferredValue`内部会调用`useState`并触发一次`更新`。

这次`更新`的`优先级`很低，所以当前如果有正在进行中的`更新`，不会受`useDeferredValue`产生的`更新`影响。所以`useDeferredValue`能够返回延迟的值。

当超过`timeoutMs`后`useDeferredValue`产生的`更新`还没进行（由于`优先级`太低一直被打断），则会再触发一次高优先级`更新`。

## 总结

除了以上介绍的实现，相信未来`React`还会开发更多基于`Concurrent Mode`的玩法。

`Fiber`架构在之前的章节已经学习了。所以，在本章接下来的部分，我们会按照上文的脉络，自底向上，从架构到实现讲解`Concurrent Mode`。







