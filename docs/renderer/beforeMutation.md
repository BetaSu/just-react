在本节正式开始前，让我们复习下这一章到目前为止所学的。

`Renderer`工作的阶段被称为`commit`阶段。`commit`阶段可以分为三个子阶段：

- before mutation阶段（执行`DOM`操作前）

- mutation阶段（执行`DOM`操作）

- layout阶段（执行`DOM`操作后）

本节我们看看`before mutation阶段`（执行`DOM`操作前）都做了什么。

## 概览

`before mutation阶段`的代码很短，整个过程就是遍历`effectList`并调用`commitBeforeMutationEffects`函数处理。

> 这部分[源码在这里](https://github.com/facebook/react/blob/1fb18e22ae66fdb1dc127347e169e73948778e5a/packages/react-reconciler/src/ReactFiberWorkLoop.new.js#L2104-L2127)。为了增加可读性，示例代码中删除了不相关的逻辑

```js
// 保存之前的优先级，以同步优先级执行，执行完毕后恢复之前优先级
const previousLanePriority = getCurrentUpdateLanePriority();
setCurrentUpdateLanePriority(SyncLanePriority);

// 将当前上下文标记为CommitContext，作为commit阶段的标志
const prevExecutionContext = executionContext;
executionContext |= CommitContext;

// 处理focus状态
focusedInstanceHandle = prepareForCommit(root.containerInfo);
shouldFireAfterActiveInstanceBlur = false;

// beforeMutation阶段的主函数
commitBeforeMutationEffects(finishedWork);

focusedInstanceHandle = null;
```

我们重点关注`beforeMutation`阶段的主函数`commitBeforeMutationEffects`做了什么。

## commitBeforeMutationEffects

大体代码逻辑：

```js
function commitBeforeMutationEffects() {
  while (nextEffect !== null) {
    const current = nextEffect.alternate;

    if (!shouldFireAfterActiveInstanceBlur && focusedInstanceHandle !== null) {
      // ...focus blur相关
    }

    const effectTag = nextEffect.effectTag;

    // 调用getSnapshotBeforeUpdate
    if ((effectTag & Snapshot) !== NoEffect) {
      commitBeforeMutationEffectOnFiber(current, nextEffect);
    }

    // 调度useEffect
    if ((effectTag & Passive) !== NoEffect) {
      if (!rootDoesHavePassiveEffects) {
        rootDoesHavePassiveEffects = true;
        scheduleCallback(NormalSchedulerPriority, () => {
          flushPassiveEffects();
          return null;
        });
      }
    }
    nextEffect = nextEffect.nextEffect;
  }
}
```

整体可以分为三部分：

1. 处理`DOM节点`渲染/删除后的 `autoFocus`、`blur` 逻辑。

2. 调用`getSnapshotBeforeUpdate`生命周期钩子。

3. 调度`useEffect`。

我们讲解下2、3两点。

## 调用getSnapshotBeforeUpdate

`commitBeforeMutationEffectOnFiber`是`commitBeforeMutationLifeCycles`的别名。

在该方法内会调用`getSnapshotBeforeUpdate`。

> 你可以在[这里](https://github.com/facebook/react/blob/1fb18e22ae66fdb1dc127347e169e73948778e5a/packages/react-reconciler/src/ReactFiberCommitWork.old.js#L222)看到这段逻辑

从`React`v16开始，`componentWillXXX`钩子前增加了`UNSAFE_`前缀。

究其原因，是因为`Stack Reconciler`重构为`Fiber Reconciler`后，`render阶段`的任务可能中断/重新开始，对应的组件在`render阶段`的生命周期钩子（即`componentWillXXX`）可能触发多次。

这种行为和`React`v15不一致，所以标记为`UNSAFE_`。

> 更详细的解释参照[这里](https://juejin.im/post/6847902224287285255#comment)

为此，`React`提供了替代的生命周期钩子`getSnapshotBeforeUpdate`。

我们可以看见，`getSnapshotBeforeUpdate`是在`commit阶段`内的`before mutation阶段`调用的，由于`commit阶段`是同步的，所以不会遇到多次调用的问题。


## 调度`useEffect`

在这几行代码内，`scheduleCallback`方法由`Scheduler`模块提供，用于以某个优先级异步调度一个回调函数。

```js
// 调度useEffect
if ((effectTag & Passive) !== NoEffect) {
  if (!rootDoesHavePassiveEffects) {
    rootDoesHavePassiveEffects = true;
    scheduleCallback(NormalSchedulerPriority, () => {
      // 触发useEffect
      flushPassiveEffects();
      return null;
    });
  }
}
```

在此处，被异步调度的回调函数就是触发`useEffect`的方法`flushPassiveEffects`。

我们接下来讨论`useEffect`如何被异步调度，以及为什么要异步（而不是同步）调度。

### 如何异步调度

在`flushPassiveEffects`方法内部会从全局变量`rootWithPendingPassiveEffects`获取`effectList`。

关于`flushPassiveEffects`的具体讲解参照[useEffect与useLayoutEffect一节](../hooks/useeffect.html)

在[completeWork一节](../process/completeWork.html#effectlist)我们讲到，`effectList`中保存了需要执行副作用的`Fiber节点`。其中副作用包括

- 插入`DOM节点`（Placement）
- 更新`DOM节点`（Update）
- 删除`DOM节点`（Deletion）

除此外，当一个`FunctionComponent`含有`useEffect`或`useLayoutEffect`，他对应的`Fiber节点`也会被赋值`effectTag`。

> 你可以从[这里](https://github.com/facebook/react/blob/1fb18e22ae66fdb1dc127347e169e73948778e5a/packages/react-reconciler/src/ReactHookEffectTags.js)看到`hook`相关的`effectTag`


在`flushPassiveEffects`方法内部会遍历`rootWithPendingPassiveEffects`（即`effectList`）执行`effect`回调函数。

如果在此时直接执行，`rootWithPendingPassiveEffects === null`。

那么`rootWithPendingPassiveEffects`会在何时赋值呢？

在上一节`layout之后`的代码片段中会根据`rootDoesHavePassiveEffects === true?`决定是否赋值`rootWithPendingPassiveEffects`。

```js
const rootDidHavePassiveEffects = rootDoesHavePassiveEffects;
if (rootDoesHavePassiveEffects) {
  rootDoesHavePassiveEffects = false;
  rootWithPendingPassiveEffects = root;
  pendingPassiveEffectsLanes = lanes;
  pendingPassiveEffectsRenderPriority = renderPriorityLevel;
}
```

所以整个`useEffect`异步调用分为三步：

1. `before mutation阶段`在`scheduleCallback`中调度`flushPassiveEffects`
2. `layout阶段`之后将`effectList`赋值给`rootWithPendingPassiveEffects`
3. `scheduleCallback`触发`flushPassiveEffects`，`flushPassiveEffects`内部遍历`rootWithPendingPassiveEffects`

### 为什么需要异步调用

摘录自`React`文档[effect 的执行时机](https://zh-hans.reactjs.org/docs/hooks-reference.html#timing-of-effects)：

> 与 componentDidMount、componentDidUpdate 不同的是，在浏览器完成布局与绘制之后，传给 useEffect 的函数会延迟调用。这使得它适用于许多常见的副作用场景，比如设置订阅和事件处理等情况，因此不应在函数中执行阻塞浏览器更新屏幕的操作。

可见，`useEffect`异步执行的原因主要是防止同步执行时阻塞浏览器渲染。

## 总结

经过本节学习，我们知道了在`before mutation阶段`，会遍历`effectList`，依次执行：

1. 处理`DOM节点`渲染/删除后的 `autoFocus`、`blur`逻辑

2. 调用`getSnapshotBeforeUpdate`生命周期钩子

3. 调度`useEffect`