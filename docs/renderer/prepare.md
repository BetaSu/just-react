上一章[最后一节](../process/completeWork.html#流程结尾)我们介绍了，`commitRoot`方法是`commit阶段`工作的起点。`fiberRootNode`会作为传参。

```js
commitRoot(root);
```

在`rootFiber.firstEffect`上保存了一条需要执行`副作用`的`Fiber节点`的单向链表`effectList`，这些`Fiber节点`的`updateQueue`中保存了变化的`props`。

这些`副作用`对应的`DOM操作`在`commit`阶段执行。

除此之外，一些生命周期钩子（比如`componentDidXXX`）、`hook`（比如`useEffect`）需要在`commit`阶段执行。

`commit`阶段的主要工作（即`Renderer`的工作流程）分为三部分：

- before mutation阶段（执行`DOM`操作前）

- mutation阶段（执行`DOM`操作）

- layout阶段（执行`DOM`操作后）

你可以从[这里](https://github.com/facebook/react/blob/1fb18e22ae66fdb1dc127347e169e73948778e5a/packages/react-reconciler/src/ReactFiberWorkLoop.new.js#L2001)看到`commit`阶段的完整代码

在`before mutation阶段`之前和`layout阶段`之后还有一些额外工作，涉及到比如`useEffect`的触发、`优先级相关`的重置、`ref`的绑定/解绑。

这些对我们当前属于超纲内容，为了内容完整性，在这节简单介绍。



## before mutation之前

`commitRootImpl`方法中直到第一句`if (firstEffect !== null)`之前属于`before mutation`之前。

我们大体看下他做的工作，现在你还不需要理解他们：

```js
do {
    // 触发useEffect回调与其他同步任务。由于这些任务可能触发新的渲染，所以这里要一直遍历执行直到没有任务
    flushPassiveEffects();
  } while (rootWithPendingPassiveEffects !== null);

  // root指 fiberRootNode
  // root.finishedWork指当前应用的rootFiber
  const finishedWork = root.finishedWork;

  // 凡是变量名带lane的都是优先级相关
  const lanes = root.finishedLanes;
  if (finishedWork === null) {
    return null;
  }
  root.finishedWork = null;
  root.finishedLanes = NoLanes;

  // 重置Scheduler绑定的回调函数
  root.callbackNode = null;
  root.callbackId = NoLanes;

  let remainingLanes = mergeLanes(finishedWork.lanes, finishedWork.childLanes);
  // 重置优先级相关变量
  markRootFinished(root, remainingLanes);

  // 清除已完成的discrete updates，例如：用户鼠标点击触发的更新。
  if (rootsWithPendingDiscreteUpdates !== null) {
    if (
      !hasDiscreteLanes(remainingLanes) &&
      rootsWithPendingDiscreteUpdates.has(root)
    ) {
      rootsWithPendingDiscreteUpdates.delete(root);
    }
  }

  // 重置全局变量
  if (root === workInProgressRoot) {
    workInProgressRoot = null;
    workInProgress = null;
    workInProgressRootRenderLanes = NoLanes;
  } else {
  }

  // 将effectList赋值给firstEffect
  // 由于每个fiber的effectList只包含他的子孙节点
  // 所以根节点如果有effectTag则不会被包含进来
  // 所以这里将有effectTag的根节点插入到effectList尾部
  // 这样才能保证有effect的fiber都在effectList中
  let firstEffect;
  if (finishedWork.effectTag > PerformedWork) {
    if (finishedWork.lastEffect !== null) {
      finishedWork.lastEffect.nextEffect = finishedWork;
      firstEffect = finishedWork.firstEffect;
    } else {
      firstEffect = finishedWork;
    }
  } else {
    // 根节点没有effectTag
    firstEffect = finishedWork.firstEffect;
  }
```

可以看到，`before mutation`之前主要做一些变量赋值，状态重置的工作。

这一长串代码我们只需要关注最后赋值的`firstEffect`，在`commit`的三个子阶段都会用到他。

## layout之后

接下来让我们简单看下`layout`阶段执行完后的代码，现在你还不需要理解他们：

```js
const rootDidHavePassiveEffects = rootDoesHavePassiveEffects;

// useEffect相关
if (rootDoesHavePassiveEffects) {
  rootDoesHavePassiveEffects = false;
  rootWithPendingPassiveEffects = root;
  pendingPassiveEffectsLanes = lanes;
  pendingPassiveEffectsRenderPriority = renderPriorityLevel;
} else {}

// 性能优化相关
if (remainingLanes !== NoLanes) {
  if (enableSchedulerTracing) {
    // ...
  }
} else {
  // ...
}

// 性能优化相关
if (enableSchedulerTracing) {
  if (!rootDidHavePassiveEffects) {
    // ...
  }
}

// ...检测无限循环的同步任务
if (remainingLanes === SyncLane) {
  // ...
} 

// 在离开commitRoot函数前调用，触发一次新的调度，确保任何附加的任务被调度
ensureRootIsScheduled(root, now());

// ...处理未捕获错误及老版本遗留的边界问题


// 执行同步任务，这样同步任务不需要等到下次事件循环再执行
// 比如在 componentDidMount 中执行 setState 创建的更新会在这里被同步执行
// 或useLayoutEffect
flushSyncCallbackQueue();

return null;
```


> 你可以在[这里](https://github.com/facebook/react/blob/1fb18e22ae66fdb1dc127347e169e73948778e5a/packages/react-reconciler/src/ReactFiberWorkLoop.new.js#L2195)看到这段代码

主要包括三点内容：

1. `useEffect`相关的处理。

我们会在讲解`layout阶段`时讲解。

2. 性能追踪相关。

源码里有很多和`interaction`相关的变量。他们都和追踪`React`渲染时间、性能相关，在[Profiler API](https://zh-hans.reactjs.org/docs/profiler.html)和[DevTools](https://github.com/facebook/react-devtools/pull/1069)中使用。

> 你可以在这里看到[interaction的定义](https://gist.github.com/bvaughn/8de925562903afd2e7a12554adcdda16#overview)

3. 在`commit`阶段会触发一些生命周期钩子（如 `componentDidXXX`）和`hook`（如`useLayoutEffect`、`useEffect`）。

在这些回调方法中可能触发新的更新，新的更新会开启新的`render-commit`流程。考虑如下Demo：

::: details useLayoutEffect Demo

在该Demo中我们点击页面中的数字，状态会先变为0，再在`useLayoutEffect`回调中变为随机数。但在页面上数字不会变为0，而是直接变为新的随机数。

这是因为`useLayoutEffect`会在`layout阶段`同步执行回调。回调中我们触发了状态更新`setCount(randomNum)`，这会重新调度一个同步任务。

该任务会在在如上`commitRoot`倒数第二行代码处被同步执行。

```js
flushSyncCallbackQueue();
```

所以我们看不到页面中元素先变为0。

如果换成`useEffect`多点击几次就能看到区别。

[关注公众号](../me.html)，后台回复**908**获得在线Demo地址

:::
