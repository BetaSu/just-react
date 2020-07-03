上一节我们聊到React15架构不能支撑异步更新以至于需要重构。那么这一节我们来学习重构后的React16是如何支持异步更新的。

## React16架构

React16架构可以分为三层：

- Scheduler（调度器）—— 调度任务的优先级，高优任务优先进入**Reconciler**
- Reconciler（协调器）—— 负责找出变化的组件
- Renderer（渲染器）—— 负责将变化的组件渲染到页面上

可以看到，相较于React15，React16中新增了**Scheduler（调度器）**，让我们来了解下他。

### Scheduler（调度器）

既然我们以浏览器是否有剩余时间作为任务中断的标准，那么我们需要一种机制，当浏览器有剩余时间时通知我们。

其实部分浏览器已经实现了这个API，这就是[requestIdleCallback](https://developer.mozilla.org/zh-CN/docs/Web/API/Window/requestIdleCallback)。但是由于以下因素，`React`放弃使用：

- 浏览器兼容性
- 触发频率不稳定，受很多因素影响。比如当我们的浏览器切换tab后，之前tab注册的`requestIdleCallback`触发的频率会变得很低

基于以上原因，`React`实现了功能更完备的`requestIdleCallback`polyfill，这就是**Scheduler**。除了在空闲时触发回调的功能外，**Scheduler**还提供了多种调度优先级供任务设置。

> [Schduler](https://github.com/facebook/react/blob/v16.13.1/packages/scheduler/README.md)是独立于`React`的库

### Reconciler（协调器）

我们知道，在React15中**Reconciler**是递归处理虚拟DOM的。让我们看看[React16的Reconciler](https://github.com/facebook/react/blob/v16.13.1/packages/react-reconciler/src/ReactFiberWorkLoop.js#L1467)。

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

那么React16是如何解决中断更新时DOM渲染不完全的问题呢？

在React16中，**Reconciler**与**Renderer**不再是交替工作。当**Scheduler**将任务交给**Reconciler**后，**Reconciler**会为变化的虚拟DOM打上代表增/删/更新的标记，类似这样：

```js
export const Placement = /*             */ 0b0000000000010;
export const Update = /*                */ 0b0000000000100;
export const PlacementAndUpdate = /*    */ 0b0000000000110;
export const Deletion = /*              */ 0b0000000001000;
```

> 全部的标记见[这里](https://github.com/facebook/react/blob/v16.13.1/packages/shared/ReactSideEffectTags.js)

整个**Scheduler**与**Reconciler**的工作都在内存中进行。只有当所有组件都完成**Reconciler**的工作，才会统一交给**Renderer**。

> 你可以在[这里](https://zh-hans.reactjs.org/docs/codebase-overview.html#fiber-reconciler)看到`React`官方对React16新**Reconciler**的解释

### Renderer（渲染器）

**Renderer**根据**Reconciler**为虚拟DOM打的标记，同步执行对应的DOM操作。

所以，对于我们在上一节使用过的Demo

::: details 乘法小Demo
[Demo](https://code.h5jun.com/jaluv/1/edit?html,js,output)

`state.count = 1`，每次点击按钮`state.count++`

列表中3个元素的值分别为1，2，3乘以`state.count`的结果 
:::

在React16架构中整个更新流程为：

<img :src="$withBase('/img/process.png')" alt="更新流程">

其中红框中的步骤随时可能由于以下原因被中断：

- 有其他更高优任务需要先更新
- 当前帧没有剩余时间

由于红框中的工作都在内存中进行，不会更新页面上的DOM，即使反复中断用户也不会看见更新不完全的DOM。

> 实时上，由于**Scheduler**和**Reconciler**都是平台无关的，所以`React`为他们单独发了一个包[react-Reconciler](https://www.npmjs.com/package/react-Reconciler)。你可以用这个包自己实现一个`ReactDOM`，具体见**参考资料**
 
## 参考资料
React前经理Sophie在React Conf 2019的演讲 

[「英文 外网 计划翻译」Building a Custom React Renderer | Sophie Alpert](https://www.youtube.com/watch?v=CGpMlWVcHok&list=PLPxbbTqCLbGHPxZpw4xj_Wwg8-fdNxJRh&index=7)

