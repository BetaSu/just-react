通过上一节学习，我们知道`状态更新`流程开始后首先会`创建Update对象`。本节我们详细了解`Update`机制的工作原理。

## Update 结构

我们先来了解`Update`的结构。创建`Update`的函数如下：

```js
function createUpdate(
  eventTime: number,
  lane: Lane,
  suspenseConfig: null | SuspenseConfig
): Update<*> {
  const update: Update<*> = {
    eventTime,
    lane,
    suspenseConfig,
    tag: UpdateState,
    payload: null,
    callback: null,

    next: null,
  };
  return update;
}
```

> 你可以从[这里](https://github.com/facebook/react/blob/master/packages/react-reconciler/src/ReactUpdateQueue.old.js#L189)看到`createUpdate`的源码

字段意义如下：

- eventTime：任务时间，通过 performance.now()获取的毫秒数。由于该字段在未来会重构，当前我们不需要理解他。

- lane：优先级相关字段。我们当前还不需要掌握他。只需要知道不同`Update`优先级可能是不同的。

- suspenseConfig：`Suspense`相关，暂不关注。

- tag：更新的类型，包括`UpdateState` | `ReplaceState` | `ForceUpdate` | `CaptureUpdate`。

- payload：更新挂载的数据。不同类型组件挂载的数据不同，会在本章后续章节讲解。

- callback：更新的回调函数。即在[commit 阶段的 layout 子阶段一节](../renderer/layout.html#commitlayouteffectonfiber)中提到的`回调函数`。

- next：与其他`Update`连接形成链表。

## Update 的意义

<!-- beginWork getStateFromUpdate -->
