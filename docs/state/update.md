通过上一节学习，我们知道`状态更新`流程开始后首先会`创建Update对象`。

本节我们学习`Update`的结构与工作流程。

## Update的分类

我们先来了解`Update`的结构。

首先，我们将可以触发更新的方法所隶属的组件分类：

- ReactDOM.render —— HostRoot

- this.setState —— ClassComponent

- this.forceUpdate —— ClassComponent

- useState —— FunctionComponent

- useReducer —— FunctionComponent

可以看到，一共三种组件（`HostRoot` | `ClassComponent` | `FunctionComponent`）可以触发更新。

由于不同类型组件工作方式不同，所以存在两种不同结构的`Update`，其中`ClassComponent`与`HostRoot`共用一套`Update`结构，`FunctionComponent`单独使用一种`Update`结构。

虽然他们的结构不同，但是他们工作机制与工作流程大体相同。在本节我们介绍前一种`Update`，`FunctionComponent`对应的`Update`在`Hooks`章节介绍。

## Update的结构

`ClassComponent`与`HostRoot`（即`rootFiber.tag`对应类型）共用同一种`Update结构`。

对应的结构如下：

```js
const update: Update<*> = {
  eventTime,
  lane,
  suspenseConfig,
  tag: UpdateState,
  payload: null,
  callback: null,

  next: null,
};
```

> `Update`由`createUpdate`方法返回，你可以从[这里](https://github.com/facebook/react/blob/master/packages/react-reconciler/src/ReactUpdateQueue.old.js#L189)看到`createUpdate`的源码

字段意义如下：

- eventTime：任务时间，通过`performance.now()`获取的毫秒数。由于该字段在未来会重构，当前我们不需要理解他。

- lane：优先级相关字段。当前还不需要掌握他，只需要知道不同`Update`优先级可能是不同的。

- suspenseConfig：`Suspense`相关，暂不关注。

- tag：更新的类型，包括`UpdateState` | `ReplaceState` | `ForceUpdate` | `CaptureUpdate`。

- payload：更新挂载的数据，不同类型组件挂载的数据不同。对于`ClassComponent`，`payload`为`this.setState`的第一个传参。对于`HostRoot`，`payload`为`ReactDOM.render`的第一个传参。

- callback：更新的回调函数。即在[commit 阶段的 layout 子阶段一节](../renderer/layout.html#commitlayouteffectonfiber)中提到的`回调函数`。

- next：与其他`Update`连接形成链表。

## Update与Fiber的联系

我们发现，`Update`存在一个连接其他`Update`形成链表的字段`next`。联系`React`中另一种以链表形式组成的结构`Fiber`，他们之间有什么关联么？

答案是肯定的。

从[双缓存机制一节](../process/doubleBuffer.html)我们知道，`Fiber节点`组成`Fiber树`，页面中最多同时存在两棵`Fiber树`：

- 代表当前页面状态的`current Fiber树`

- 代表正在`render阶段`的`workInProgress Fiber树`

类似`Fiber节点`组成`Fiber树`，`Fiber节点`上的多个`Update`会组成`updateQueue`。`Fiber节点`最多同时存在两个`updateQueue`：

- `current fiber`保存的`updateQueue`即`current updateQueue`

- `workInProgress fiber`保存的`updateQueue`即`workInProgress updateQueue`

::: warning 什么情况下一个Fiber节点会存在多个Update？

你可能疑惑为什么一个`Fiber节点`会存在多个`Update`。这其实是很常见的情况。

在这里我介绍一种最简单的情况：

```js
onClick() {
  this.setState({
    a: 1
  })

  this.setState({
    b: 2
  })
}
```

在一个`ClassComponent`中触发`this.onClick`方法，方法内部调用了两次`this.setState`。这会在该`fiber`中产生两个`Update`。

:::

在`commit阶段`完成页面渲染后，`workInProgress Fiber树`变为`current Fiber树`，`workInProgress Fiber树`内`Fiber节点`的`updateQueue`就变成`current updateQueue`。

## updateQueue

让我们来看下`updateQueue`的结构。由于`Update`有两种类型，`updateQueue`也有两种。

`ClassComponent`与`HostRoot`使用的`UpdateQueue`结构如下：

```js
const queue: UpdateQueue<State> = {
    baseState: fiber.memoizedState,
    firstBaseUpdate: null,
    lastBaseUpdate: null,
    shared: {
      pending: null,
    },
    effects: null,
  };
```

> `UpdateQueue`由`initializeUpdateQueue`方法返回，你可以从[这里](https://github.com/facebook/react/blob/master/packages/react-reconciler/src/ReactUpdateQueue.new.js#L157)看到`initializeUpdateQueue`的源码

字段说明如下：

- baseState：本次更新前该`Fiber节点`的`state`，`Update`基于该`state`计算更新后的`state`。

- `firstBaseUpdate`与`lastBaseUpdate`：本次更新前该`Fiber节点`已保存的`Update`。以链表形式存在，链表头为`firstBaseUpdate`，链表尾为`lastBaseUpdate`。之所以在更新产生前该`Fiber节点`内就存在`Update`，是由于某些`Update`优先级较低所以在上次`render阶段`由`Update`计算`state`时被跳过。

- `shared.pending`：触发更新时，产生的`Update`会保存在`shared.pending`中形成单向环状链表。当由`Update`计算`state`时这个环会被剪开并连接在`lastBaseUpdate`后面。

- effects：数组。保存`update.calback !== null`的`Update`。



## updateQueue工作流程例子

`updateQueue`相关代码逻辑涉及到大量链表操作，比较难懂。我们举个例子对`shared.pending`、`firstBaseUpdate`与`lastBaseUpdate`的工作详细讲解下。

假设有一个`fiber`刚经历`commit阶段`完成渲染。该`fiber`上有两个由于优先级过低所以在上次的`render阶段`并没有处理的`Update`。

我们称其为`u1`和`u2`，其中`u1.next === u2`。

```js
fiber.updateQueue.firstBaseUpdate === u1;
fiber.updateQueue.lastBaseUpdate === u2;
u1.next === u2;
```

我们用`-->`表示链表的指向：

```js
fiber.updateQueue.baseUpdate: u1 --> u2
```

我们在`fiber`上触发两次状态更新，这会产生两个新`Update`。

我们称其为`u3`和`u4`。

```js
fiber.updateQueue.shared.pending === u3;
u3.next === u4;
u4.next === u3;
```

由于`shared.pending`是环状链表，用图表示为：

```js
fiber.updateQueue.shared.pending:   u3 --> u4 
                                     ^      |                                    
                                     |______|
```

更新调度完成后进入`render阶段`。

此时`shared.pending`的环被剪开并连接在`updateQueue.lastBaseUpdate`后面：

```js
fiber.updateQueue.baseUpdate: u1 --> u2 --> u3 --> u4
```

接下来遍历`updateQueue.baseUpdate`链表，以`fiber.updateQueue.baseState`为`初始state`，依次与遍历到的每个`Update`计算并产生新的`state`（该操作类比`Array.prototype.reduce`）。

当遍历完成后获得的`state`，就是该`Fiber节点`在本次更新的`state`（源码中叫做`memoizedState`）。

> `render阶段`的`Update操作`由`processUpdateQueue`完成，你可以从[这里](https://github.com/facebook/react/blob/master/packages/react-reconciler/src/ReactUpdateQueue.new.js#L405)看到`processUpdateQueue`的源码

`state`的变化在`render阶段`产生与上次更新不同的`JSX`对象，通过`Diff算法`产生`effectTag`，在`commit阶段`渲染在页面上。

渲染完成后`workInProgress Fiber树`变为`current Fiber树`，整个更新流程结束。

## 参考资料

[React源码中讲解Update工作流程及优先级的注释](https://github.com/facebook/react/blob/master/packages/react-reconciler/src/ReactUpdateQueue.new.js#L10)

[React Core Team Andrew向网友讲解Update工作流程的推文](https://twitter.com/acdlite/status/978412930973687808)

<!-- beginWork getStateFromUpdate -->
