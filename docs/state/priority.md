通过[更新的心智模型](./mental.html)，我们了解到`更新`具有`优先级`。

那么什么是`优先级`？`优先级`以什么为依据？如何通过`优先级`决定哪个状态应该先被更新？

本节我们会详细讲解。

## 什么是优先级

在[React理念一节](../preparation/idea.html#理解-响应自然)我们聊到`React`将人机交互研究的结果整合到真实的`UI`中。具体到`React`运行上这是什么意思呢？

`状态更新`由`用户交互`产生，用户心里对`交互`执行顺序有个预期。`React`根据`人机交互研究的结果`中用户对`交互`的预期顺序为`交互`产生的`状态更新`赋予不同优先级。

具体如下：

- 生命周期方法：同步执行。

- 受控的用户输入：比如输入框内输入文字，同步执行。

- 交互事件：比如动画，高优先级执行。

- 其他：比如数据请求，低优先级执行。

## 如何调度优先级

我们在[新的React结构一节](../preparation/newConstructure.html)讲到，`React`通过`Scheduler`调度任务。

具体到代码，每当需要调度任务时，`React`会调用`Scheduler`提供的方法`runWithPriority`。

该方法接收一个`优先级`常量与一个`回调函数`作为参数。`回调函数`会以`优先级`高低为顺序排列在一个`定时器`中并在合适的时间触发。

对于更新来讲，传递的`回调函数`一般为[状态更新流程概览一节](./prepare.html#render阶段的开始)讲到的`render阶段的入口函数`。

> 你可以在[==unstable_runWithPriority== 这里](https://github.com/facebook/react/blob/970fa122d8188bafa600e9b5214833487fbf1092/packages/scheduler/src/Scheduler.js#L217)看到`runWithPriority`方法的定义。在[这里](https://github.com/facebook/react/blob/970fa122d8188bafa600e9b5214833487fbf1092/packages/scheduler/src/SchedulerPriorities.js)看到`Scheduler`对优先级常量的定义。

## 例子

优先级最终会反映到`update.lane`变量上。当前我们只需要知道这个变量能够区分`Update`的优先级。

接下来我们通过一个例子结合上一节介绍的`Update`相关字段讲解优先级如何决定更新的顺序。

> 该例子来自[React Core Team Andrew向网友讲解Update工作流程的推文](https://twitter.com/acdlite/status/978412930973687808)

<img :src="$withBase('/img/update-process.png')" alt="优先级如何决定更新的顺序">

在这个例子中，有两个`Update`。我们将“关闭黑夜模式”产生的`Update`称为`u1`，输入字母“I”产生的`Update`称为`u2`。

其中`u1`先触发并进入`render阶段`。其优先级较低，执行时间较长。此时：

```js
fiber.updateQueue = {
  baseState: {
    blackTheme: true,
    text: 'H'
  },
  firstBaseUpdate: null,
  lastBaseUpdate: null
  shared: {
    pending: u1
  },
  effects: null
};
```

在`u1`完成`render阶段`前用户通过键盘输入字母“I”，产生了`u2`。`u2`属于**受控的用户输入**，优先级高于`u1`，于是中断`u1`产生的`render阶段`。

此时：

```js
fiber.updateQueue.shared.pending === u2 ----> u1
                                     ^        |
                                     |________|
// 即
u2.next === u1;
u1.next === u2;
```

其中`u2`优先级高于`u1`。

接下来进入`u2`产生的`render阶段`。

在`processUpdateQueue`方法中，`shared.pending`环状链表会被剪开并拼接在`baseUpdate`后面。

需要明确一点，`shared.pending`指向最后一个`pending`的`update`，所以实际执行时`update`的顺序为：

```js
u1 -- u2
```

接下来遍历`baseUpdate`，处理优先级合适的`Update`（这一次处理的是更高优的`u2`）。

由于`u2`不是`baseUpdate`中的第一个`update`，在其之前的`u1`由于优先级不够被跳过。

`update`之间可能有依赖关系，所以被跳过的`update`及其后面所有`update`会成为下次更新的`baseUpdate`。（即`u1 -- u2`）。

最终`u2`完成`render - commit阶段`。

此时：

```js
fiber.updateQueue = {
  baseState: {
    blackTheme: true,
    text: 'HI'
  },
  firstBaseUpdate: u1,
  lastBaseUpdate: u2
  shared: {
    pending: null
  },
  effects: null
};
```

在`commit`阶段结尾会再调度一次更新。在该次更新中会基于`baseState`中`firstBaseUpdate`保存的`u1`，开启一次新的`render阶段`。

最终两次`Update`都完成后的结果如下：

```js
fiber.updateQueue = {
  baseState: {
    blackTheme: false,
    text: 'HI'
  },
  firstBaseUpdate: null,
  lastBaseUpdate: null
  shared: {
    pending: null
  },
  effects: null
};
```

我们可以看见，`u1`对应的更新执行了两次，相应的`render阶段`的生命周期勾子`componentWillXXX`也会触发两次。这也是为什么这些勾子会被标记为`unsafe_`。

## 如何保证状态正确

现在我们基本掌握了`updateQueue`的工作流程。还有两个疑问：

- `render阶段`可能被中断。如何保证`updateQueue`中保存的`Update`不丢失？

- 有时候当前`状态`需要依赖前一个`状态`。如何在支持跳过`低优先级状态`的同时保证**状态依赖的连续性**？

我们分别讲解下。

### 如何保证`Update`不丢失

在[上一节例子](./update.html#例子)中我们讲到，在`render阶段`，`shared.pending`的环被剪开并连接在`updateQueue.lastBaseUpdate`后面。

实际上`shared.pending`会被同时连接在`workInProgress updateQueue.lastBaseUpdate`与`current updateQueue.lastBaseUpdate`后面。

> 具体代码见[这里](https://github.com/facebook/react/blob/970fa122d8188bafa600e9b5214833487fbf1092/packages/react-reconciler/src/ReactUpdateQueue.new.js#L424)

当`render阶段`被中断后重新开始时，会基于`current updateQueue`克隆出`workInProgress updateQueue`。由于`current updateQueue.lastBaseUpdate`已经保存了上一次的`Update`，所以不会丢失。

当`commit阶段`完成渲染，由于`workInProgress updateQueue.lastBaseUpdate`中保存了上一次的`Update`，所以 `workInProgress Fiber树`变成`current Fiber树`后也不会造成`Update`丢失。

### 如何保证状态依赖的连续性

当某个`Update`由于优先级低而被跳过时，保存在`baseUpdate`中的不仅是该`Update`，还包括链表中该`Update`之后的所有`Update`。

考虑如下例子：

```js
baseState: ''
shared.pending: A1 --> B2 --> C1 --> D2
```

其中`字母`代表该`Update`要在页面插入的字母，`数字`代表`优先级`，值越低`优先级`越高。

第一次`render`，`优先级`为1。

```js
baseState: ''
baseUpdate: null
render阶段使用的Update: [A1, C1]
memoizedState: 'AC'
```

其中`B2`由于优先级为2，低于当前优先级，所以他及其后面的所有`Update`会被保存在`baseUpdate`中作为下次更新的`Update`（即`B2 C1 D2`）。

这么做是为了保持`状态`的前后依赖顺序。

第二次`render`，`优先级`为2。

```js
baseState: 'A'
baseUpdate: B2 --> C1 --> D2
render阶段使用的Update: [B2, C1, D2]
memoizedState: 'ABCD'
```

注意这里`baseState`并不是上一次更新的`memoizedState`。这是由于`B2`被跳过了。

即当有`Update`被跳过时，`下次更新的baseState !== 上次更新的memoizedState`。

> 跳过`B2`的逻辑见[这里](https://github.com/facebook/react/blob/970fa122d8188bafa600e9b5214833487fbf1092/packages/react-reconciler/src/ReactUpdateQueue.new.js#L479)

通过以上例子我们可以发现，`React`保证最终的状态一定和用户触发的`交互`一致，但是中间过程`状态`可能由于设备不同而不同。

:::details 高优先级任务打断低优先级任务Demo

[关注公众号](../me.html)，后台回复**815**获得在线Demo地址

:::

## 参考资料

[深入源码剖析componentWillXXX为什么UNSAFE](https://juejin.im/post/5f05a3e25188252e5c576cdb)

[React源码中讲解Update工作流程及优先级的注释](https://github.com/facebook/react/blob/970fa122d8188bafa600e9b5214833487fbf1092/packages/react-reconciler/src/ReactUpdateQueue.new.js#L10)

[React Core Team Andrew向网友讲解Update工作流程的推文](https://twitter.com/acdlite/status/978412930973687808)

<!-- beginWork getStateFromUpdate -->
