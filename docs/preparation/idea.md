## 从理念出发
软件的设计是为了服务理念，我们只有懂了设计理念，才能明白为了实现这样的理念需要如何架构。所以，在我们深入源码架构之前，先来聊聊`React`理念。

## React的理念
我们可以从[官网](https://zh-hans.reactjs.org/docs/thinking-in-react.html)看到，`React`的理念是：
> 我们认为，React 是用 JavaScript 构建**快速响应**的大型 Web 应用程序的首选方式。它在 Facebook 和 Instagram 上表现优秀。

<!-- > 同时，我们可以看看`React`核心团队成员Dan回答网友关于`React`发展方向的提问
![用户向Dan提问](/img/ques1.png)
![Dan回答](/img/ans1.png) -->

那么该如何理解**快速响应**？可以从两个角度来看：
- 速度快
- 响应自然

`React`是如何实现这两点的呢？

## 理解“速度快”

每当聊到一款前端框架，拉出来比比渲染速度成了老生常谈。

> [这里](https://stefankrause.net/js-frameworks-benchmark8/table.html)提供了各种框架渲染速度的对比

我们经常用“前端三大框架”指`React`、`Vue`和`Angular`。相比于使用模版语言的`Vue`、`Angular`，使用原生js（`JSX`仅仅是js的语法糖）开发UI的`React`在语法层面有更多灵活性。

然而，高灵活性意味着高不确定性。考虑如下`Vue`模版语句：

```vue
<template>
    <ul>
        <li>0</li>
        <li>{{ name }}</li>
        <li>2</li>
        <li>3</li>
    </ul>
</template>
```

当编译时，由于模版语法的约束，`Vue`可以明确知道在`li`中，只有`name`是变量，这可以提供一些优化线索。

而在`React`中，以上代码可以写成：

```jsx
<ul>{
    data.map((name, i) => <li>{i !== 1 ? i : name}</li>)
}</ul>
```
由于语法的灵活，在编译时无法区分变化的部分。所以在运行时，`React`需要遍历每个`li`，判断其数据是否更新。

基于以上原因，相比于`Vue`、`Angular`，缺少编译时优化手段的`React`为了**速度快**需要在运行时做出更多努力。

比如

- 使用`PureComponent`
- 使用`shouldComponentUpdate`生命周期钩子
- 渲染列表时使用`key`
- `useCallback`

由开发者来显式的告诉`React`哪些组件不需要重复计算、可以复用。

在后面源码的学习中，我们会看到代码内部还有很多这样的运行时优化路径。比如源码的[这个方法](https://github.com/facebook/react/blob/master/packages/react-reconciler/src/ReactFiberBeginWork.new.js#L2937)，会让React跳过一些本次更新不需要处理的任务。


## 理解“响应自然”

设想以下场景：

![搜索框](/img/searchbox.gif)

有一个地址搜索框，在输入字符时会实时请求当前已输入内容的地址匹配结果。

这里包括2个状态变化：
- 用户在输入框内输入的字符变化
- 显示实时匹配结果的下拉框内容变化

当用户输入过快时，由于触发的事件回调一直占据js线程，导致页面不能及时刷新，造成输入字符卡顿。

我们一般是通过`debounce`或 `throttle`来减少输入内容时触发回调的次数来解决这个问题。

有更优雅的解决办法么？

[Demo](https://code.h5jun.com/kores/7/edit?html,js,output)

>React核心团队成员Dan提到：很
![Dan关于用户体验的思考](/img/update.png)

相比于通过`debounce`这样的手段强制减少回调次数，如果我们能正常触发回调，但是`React`处于用户体验的目的，当页面**优先**使其不卡顿


回归到代码逻辑上，`React`需要区别对待不同任务优先级。

甚至极端的考虑，在例子中，假设我们已经获取到“匹配结果”的数据，触发了下拉框内容的变化，在计算下拉框需要改变的DOM节点的过程中用户又触发了输入框输入，这时候如果能搁置处理下拉框转而优先处理输入框交互，这种体验是自然的。

从以上简单的例子可以看出，为了让体验自然，`React`需要解决的问题不限于`优先级`、`饥饿`、`任务搁置与回溯`、`异步任务`。

就像Dan说的：任务数量一定时，如果他们不是异步执行，那就会同步并阻塞线程

![任务数量一定，如果他们不是异步执行，那就会同步并阻塞线程](https://user-gold-cdn.xitu.io/2020/5/31/17269da86f599011?w=2120&h=810&f=png&s=171278)

## React的架构设计

为了实现用户体验更自然的目标，从`v15`开始，`React`重写了整个架构。在当前版本中（v16.13.1），代码分为三部分：

- 调度器（scheduler）
- 协调器（reconciler）
- 渲染器（renderer）

### 调度器（scheduler）

用于调度任务的优先级，决定哪个任务需要先被协调器处理。

或者有任务优先级高于正在被协调器处理的任务，调度器会终止正在被协调的低优任务，转而开始高优任务的协调。

那么如何区分优先级呢？

简单的说，在`React`中事件被分为三类：
| 名称 | 解释 | 举例 |
|------|------------|------------|
| DiscreteEvent  | 离散事件，这些事件都是离散触发的          | blur、focus、 click、 submit、 touchStart         |
| UserBlockingEvent  | 用户阻塞事件，这些事件会阻塞用户的交互       | touchMove、mouseMove、scroll、drag、dragOver        |
| ContinuousEvent  | 连续事件，需要同步执行，不能被中断，优先级最高。       | load、error、loadStart、abort、animationEnd       |

不同类型的事件产生的任务对应不同的优先级。

### 协调器（reconciler）

经过调度后，当前最高优先级的任务会进入协调器。

协调器的主要工作是[Diff算法](https://github.com/facebook/react/blob/master/packages/react-reconciler/src/ReactChildFiber.new.js#L769)。`Diff`会比较组件前后两次更新的变化，为变化的组件打上标签（插入/删除/更新）。

由于有更高优先级任务时，调度器会搁置当前任务，转而优先协调更高优任务，接着再重新协调当前任务。

所以在协调阶段触发的生命周期钩子可能触发多次。这些钩子从React16开始都被标记为`UNSAFE_`，如：

- UNSAFE_componentWillUpdate
- UNSAFE_componentWillReceiveProps

你可能发现了，协调工作是平台无关的，他仅仅是为需要产生变化的组件打上标签。那么页面是何时更新的呢？

这就需要渲染器。

### 渲染器（renderer）

渲染器遍历在协调阶段产生变化的组件，找到组件的标签，执行标签对应的渲染操作。

比如，在`ReactDOM`渲染器中，

- 删除标签（Deletion）对应`parentNode.removeChild`
- 插入标签（Placement）对应`parentNode.appendChild` 或 `parentNode.insertBefore`

除了我们常见的`ReactDOM`渲染器，还有

- [ReactNative](https://www.npmjs.com/package/react-native)渲染器，渲染App原生组件
- [ReactTest](https://www.npmjs.com/package/react-test-renderer)渲染器，渲染出纯Js对象用于测试
- [ReactArt](https://www.npmjs.com/package/react-art)渲染器，渲染到Canvas, SVG 或 VML (IE8)

事实上，[react-reconciler](https://www.npmjs.com/package/react-reconciler)作为一个单独的包，你完全可以使用他构建自己的渲染器。

参考React团队前核心成员Sophie在React Conf 2019的演讲 [Building a Custom React Renderer | Sophie Alpert](https://www.youtube.com/watch?v=CGpMlWVcHok&list=PLPxbbTqCLbGHPxZpw4xj_Wwg8-fdNxJRh&index=7)

## 总结

从13年5月第一次`commit`到现在，`React`已经有1.3w次`commit`，在这期间核心API能一直保持不变并引领前端的变革，这与其极低的框架抽象程度是分不开的。
![](https://user-gold-cdn.xitu.io/2020/5/31/1726a5214cb4faae?w=1176&h=960&f=png&s=324344)

在下篇文章中，我们会讲解基于 调度器——协调器——渲染器 架构，一次典型的渲染是如何实现的。