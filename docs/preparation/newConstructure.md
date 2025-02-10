上一节我们聊到 React15 架构不能支撑异步更新以至于需要重构。那么这一节我们来学习重构后的 React16 是如何支持异步更新的。

## React16 架构

React16 架构可以分为三层：

- Scheduler（调度器）—— 调度任务的优先级，高优任务优先进入**Reconciler**
- Reconciler（协调器）—— 负责找出变化的组件
- Renderer（渲染器）—— 负责将变化的组件渲染到页面上

可以看到，相较于 React15，React16 中新增了**Scheduler（调度器）**，让我们来了解下他。

### Scheduler（调度器）

既然我们以浏览器是否有剩余时间作为任务中断的标准，那么我们需要一种机制，当浏览器有剩余时间时通知我们。

其实部分浏览器已经实现了这个 API，这就是[requestIdleCallback](https://developer.mozilla.org/zh-CN/docs/Web/API/Window/requestIdleCallback)。但是由于以下因素，`React`放弃使用：

- 浏览器兼容性
- 触发频率不稳定，受很多因素影响。比如当我们的浏览器切换 tab 后，之前 tab 注册的`requestIdleCallback`触发的频率会变得很低

基于以上原因，`React`实现了功能更完备的`requestIdleCallback`polyfill，这就是**Scheduler**。除了在空闲时触发回调的功能外，**Scheduler**还提供了多种调度优先级供任务设置。

> [Scheduler](https://github.com/facebook/react/blob/1fb18e22ae66fdb1dc127347e169e73948778e5a/packages/scheduler/README.md)是独立于`React`的库

### Reconciler（协调器）

我们知道，在 React15 中**Reconciler**是递归处理虚拟 DOM 的。让我们看看[React16 的 Reconciler](https://github.com/facebook/react/blob/1fb18e22ae66fdb1dc127347e169e73948778e5a/packages/react-reconciler/src/ReactFiberWorkLoop.new.js#L1673)。

我们可以看见，更新工作从递归变成了可以中断的循环过程。每次循环都会调用`shouldYield`判断当前是否有剩余时间。

```js
/** @noinline */
function workLoopConcurrent() {
  // Perform work until Scheduler asks us to yield
  while (workInProgress !== null && !shouldYield()) {
    workInProgress = performUnitOfWork(workInProgress);
  }
}
```

那么 React16 是如何解决中断更新时 DOM 渲染不完全的问题呢？

在 React16 中，**Reconciler**与**Renderer**不再是交替工作。当**Scheduler**将任务交给**Reconciler**后，**Reconciler**会为变化的虚拟 DOM 打上代表增/删/更新的标记，类似这样：

```js
export const Placement = /*             */ 0b0000000000010;
export const Update = /*                */ 0b0000000000100;
export const PlacementAndUpdate = /*    */ 0b0000000000110;
export const Deletion = /*              */ 0b0000000001000;
```

> 全部的标记见[这里](https://github.com/facebook/react/blob/1fb18e22ae66fdb1dc127347e169e73948778e5a/packages/react-reconciler/src/ReactSideEffectTags.js)

整个**Scheduler**与**Reconciler**的工作都在内存中进行。只有当所有组件都完成**Reconciler**的工作，才会统一交给**Renderer**。

> 你可以在[这里](https://zh-hans.reactjs.org/docs/codebase-overview.html#fiber-reconciler)看到`React`官方对 React16 新**Reconciler**的解释

### Renderer（渲染器）

**Renderer**根据**Reconciler**为虚拟 DOM 打的标记，同步执行对应的 DOM 操作。

所以，对于我们在上一节使用过的 Demo

::: details 乘法小 Demo

[关注公众号 魔术师卡颂](../me.html)，后台回复**222**获得在线 Demo 地址

`state.count = 1`，每次点击按钮`state.count++`

列表中 3 个元素的值分别为 1，2，3 乘以`state.count`的结果
:::

在 React16 架构中整个更新流程为：

<img :src="$withBase('/img/process.png')" alt="更新流程">

其中红框中的步骤随时可能由于以下原因被中断：

- 有其他更高优任务需要先更新
- 当前帧没有剩余时间

由于红框中的工作都在内存中进行，不会更新页面上的 DOM，所以即使反复中断，用户也不会看见更新不完全的 DOM（即上一节演示的情况）。

> 实际上，由于**Scheduler**和**Reconciler**都是平台无关的，所以`React`为他们单独发了一个包[react-Reconciler](https://www.npmjs.com/package/react-reconciler)。你可以用这个包自己实现一个`ReactDOM`，具体见**参考资料**

## 总结

通过本节我们知道了`React16`采用新的`Reconciler`。

`Reconciler`内部采用了`Fiber`的架构。

`Fiber`是什么？他和`Reconciler`或者说和`React`之间是什么关系？我们会在接下来三节解答。

## 参考资料

[「英文 外网」Building a Custom React Renderer | React 前经理 Sophie Alpert](https://www.youtube.com/watch?v=CGpMlWVcHok&list=PLPxbbTqCLbGHPxZpw4xj_Wwg8-fdNxJRh&index=7)
[hello-world-custom-react-renderer](https://agent-hunt.medium.com/hello-world-custom-react-renderer-9a95b7cd04bc)

:::details 同步/Debounce/Throttle/并发 情况下性能对比 Demo

[关注公众号 魔术师卡颂](../me.html)，后台回复**323**获得在线 Demo 地址

:::
