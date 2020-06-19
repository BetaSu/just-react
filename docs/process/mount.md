相信你一定使用过`componentDidMount`与`componentDidUpdate`生命周期钩子，了解他们各自调用的时机。

正因为他们调用的时机不同，在源码层面他们也会执行不同的操作。在接下来两节中，我们深入源码分析在`mount`和`update`时``Reconciler`的工作流程。

## 一点解惑

我们之前讲到`React`的工作架构`Scheduler - Reconciler - Renderer`，为什么先讲`Reconciler`的工作流程呢？原因有三:

1. `Scheduler`负责任务调度（注：在`React`中，从状态改变到页面渲染这之间发生的事称为一次**任务**），这是个独立的部分，我们后面会单独讲解。

2. `Renderer`负责执行DOM操作（注：我们这里针对的是`ReactDOM`），相对逻辑简单。

3. `mount`和`update`的大部分工作发生在`Reconciler`中。

## mount的定义

组件在什么情况下会`mount`？

1. 首屏渲染，此时整棵组件树会`mount`。比如调用`ReactDOM.render`方法。
2. 用户交互或其他原因使某个组件`mount`。比如用户打开一个弹窗，弹窗组件`mount`。


## Reconciler工作流程概括

我们知道`Fiber Reconciler`是从`Stack Reconciler`重构而来，通过遍历的方式实现可中断的递归，所以`Reconciler`的工作可以分为两部分：“递”和“归”。

### “递”阶段

`Reconciler`向下深度优先遍历组件，遍历到的每个组件调用[beginWork方法](https://github.com/facebook/react/blob/master/packages/react-reconciler/src/ReactFiberBeginWork.old.js#L3031)为组件的**子组件**生成对应的`Fiber`节点，并将其与已生成的`Fiber`节点连接形成`Fiber`树。

::: tip 注意
`beginWork`方法是为组件的**子组件**，而不是组件本身创建`Fiber`节点。当调用`ReactDOM.render`后会生成一个`rootFiber`，所以接下来需要生成的`Fiber`其实是`rootFiber`的子`Fiber`
:::

当遍历到叶子节点（即没有子组件的组件）时就会进入“归”阶段。


### “归”阶段

在“归”阶段会调用[completeWork](https://github.com/facebook/react/blob/master/packages/react-reconciler/src/ReactFiberCompleteWork.old.js#L652)处理`Fiber`。

当某个`Fiber`执行完`completeWork`，如果其存在兄弟`Fiber`（即`fiber.sibling !== null`），会进入其兄弟`Fiber`的“递”阶段。

如果不存在兄弟`Fiber`，会进入父级`Fiber`的“归”阶段。

组件的“递”和“归”阶段会交错执行直到`rootFiber`。如此，`Reconciler`的工作就结束了。

## 例子

以上一节的例子举例：

```js
function App() {
  return (
    <div>
      i am
      <span>KaSong</span>
    </div>
  )
}
```
对应的`Fiber`树结构：
<img :src="$withBase('/img/fiber.png')" alt="Fiber架构">





向上遍历直到最初触发`mount`的组件对应的`Fiber`节点，过程中每遍历到一个`Fiber`节点，会根据其`tag`分别处理。 

> “归”阶段调用的方法叫做

> 你可以从[ReactWorkTags.js](https://github.com/facebook/react/blob/master/packages/react-reconciler/src/ReactWorkTags.js)看到`Fiber`节点的所有`tag`定义

当遇到原生`DOM`节点对应的`Fiber`节点时，即

```js
fiber.tag === HostComponent;

// ReactWorkTags.js 中的定义
const HostComponent = 5;
```

`Reconciler`执行如下操作：

```js
// 为fiber创建对应的DOM节点，保存在 fiber.stateNode
const instance = createInstance(
  type,
  newProps,
  rootContainerInstance,
  currentHostContext,
  workInProgress,
);

// 将子fiber的dom节点插入在该DOM节点下
appendAllChildren(instance, workInProgress, false, false);
```

> [源码见这里](https://github.com/facebook/react/blob/master/packages/react-reconciler/src/ReactFiberCompleteWork.old.js#L772)

那么当`Reconciler`向上遍历直到最初触发`mount`的组件对应的`Fiber`节点时，由于每一层`DOM`节点都会被调用`appendAllChildren`方法，我们已经获得了一棵离屏的`DOM`树。








```js
function workLoopSync() {
  // Already timed out, so perform work without checking if we need to yield.
  while (workInProgress !== null) {
    performUnitOfWork(workInProgress);
  }
}
```

