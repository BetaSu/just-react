我们之前讲到`React`的工作架构`Scheduler - Reconciler - Renderer`，为什么先讲`Reconciler`的工作流程呢？原因有二:

1. `Scheduler`作为独立模块，负责任务调度（注：在`React`中，从状态改变到页面渲染这之间发生的事称为一次**任务**），并不影响渲染流程。我们后面会单独讲解。

2. `Renderer`负责执行DOM操作（注：我们这里针对的是`ReactDOM`），相对逻辑简单。

3. 组件更新的大部分计算工作发生在`Reconciler`中。

我们知道`Fiber Reconciler`是从`Stack Reconciler`重构而来，通过遍历的方式实现可中断的递归，所以`Reconciler`的工作可以分为两部分：“递”和“归”。

## “递”阶段

`Reconciler`向下深度优先遍历组件，遍历到的每个组件调用[beginWork方法](https://github.com/facebook/react/blob/master/packages/react-reconciler/src/ReactFiberBeginWork.new.js#L3040)为组件的**子组件**生成对应的`Fiber`节点，并将其与已生成的`Fiber`节点连接形成`Fiber`树。

当遍历到叶子节点（即没有子组件的组件）时就会进入“归”阶段。

::: warning 注意
`beginWork`方法是为组件的**子组件**，而不是组件本身创建`Fiber`节点。当调用`ReactDOM.render`，在进入`Reconciler`前会生成一个`rootFiber`，所以接下来需要生成的`Fiber`其实是`rootFiber`的子`Fiber`
:::


## “归”阶段

在“归”阶段会调用[completeWork](https://github.com/facebook/react/blob/master/packages/react-reconciler/src/ReactFiberCompleteWork.new.js#L652)处理`Fiber`。

当某个`Fiber`执行完`completeWork`，如果其存在兄弟`Fiber`（即`fiber.sibling !== null`），会进入其兄弟`Fiber`的“递”阶段。

如果不存在兄弟`Fiber`，会进入父级`Fiber`的“归”阶段。

组件的“递”和“归”阶段会交错执行直到“归”到`rootFiber`。如此，`Reconciler`的工作就结束了。

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

ReactDOM.render(<App/>, document.getElementById('root'));
```
对应的`Fiber`树结构：
<img :src="$withBase('/img/fiber.png')" alt="Fiber架构">

`Reconciler`会依次执行：

```sh
1. rootFiber beginWork
2. App Fiber beginWork
3. div Fiber beginWork
4. "i am" Fiber beginWork
5. "i am" Fiber completeWork
6. span Fiber beginWork
7. span Fiber completeWork
8. div Fiber completeWork
9. App Fiber completeWork
10. rootFiber completeWork
```

::: warning 注意
之所以没有 “KaSong” Fiber 的 beginWork/completeWork，是因为作为一种性能优化手段，针对只有单一文本子节点的`Fiber`，`React`会特殊处理。
:::

::: details 自己试一试 Demo
我在`beginWork`和`completeWork`调用时打印`fiber.tag`和`fiber.type`。

你可以从[ReactWorkTags.js](https://github.com/facebook/react/blob/master/packages/react-reconciler/src/ReactWorkTags.js)看到`Fiber`节点的所有`tag`定义。

相信多调试几次，你一定能明白方法的调用顺序

[Demo](https://code.h5jun.com/kexev/edit?html,js,console,output)
:::

## 总结

本节我们介绍了`Reconciler`工作中会调用的方法。在接下来两节中，我们会讲解`beginWork`和`completeWork`做的具体工作。