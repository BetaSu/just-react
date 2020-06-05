## 从理念到架构
在上一节中我们了解了`React`的理念，简单概括就是**速度快，响应自然**。

`React`从v15升级到v16后重构了整个架构。本节我们聊聊v15，看看他为什么不能满足**速度快，响应自然**的理念，以至于被重构。

## React15架构

React15架构可以分为两层：

- Reconciler（协调器）—— 负责找出变化的组件
- Renderer（渲染器）—— 负责将变化的组件渲染到页面上

### React Reconciler（协调器）

我们知道，在`React`中可以通过`this.setState`、`this.forceUpdate`、`ReactDOM.render`等API触发更新。

每当有更新发生时，**Reconciler**会做如下工作：

- 调用函数组件、或class组件的`render`方法，将返回的JSX转化为虚拟DOM
- 将虚拟DOM和上次更新时的虚拟DOM对比
- 通过对比找出本次更新中变化的虚拟DOM
- 通知**Renderer**将变化的虚拟DOM渲染到页面上

### React15 Renderer（渲染器）

由于`React`支持跨平台，所以不同平台有不同的**Renderer**。我们前端最熟悉的是负责在浏览器环境渲染的**Renderer** —— [ReactDOM](https://www.npmjs.com/package/react-dom)。

除此之外，还有：

- [ReactNative](https://www.npmjs.com/package/react-native)渲染器，渲染App原生组件
- [ReactTest](https://www.npmjs.com/package/react-test-Renderer)渲染器，渲染出纯Js对象用于测试
- [ReactArt](https://www.npmjs.com/package/react-art)渲染器，渲染到Canvas, SVG 或 VML (IE8)

在每次更新发生时，**Renderer**接到Reconciler通知，将变化的组件渲染在当前宿主环境。

## React15架构的缺点

在**Reconciler**中，`mount`的组件会调用[mountComponent](https://github.com/facebook/react/blob/15-stable/src/renderers/dom/shared/ReactDOMComponent.js#L498)，`update`的组件会调用[updateComponent](https://github.com/facebook/react/blob/15-stable/src/renderers/dom/shared/ReactDOMComponent.js#L877)。这两个方法都会递归更新子组件。

由于是递归，所以更新一旦开始，中途就无法中断。当层级很深时，递归更新操作的时间超过了16ms（浏览器一帧的时间），用户交互就会卡顿。

在上一章中，我们已经提出了解决办法——用**可中断的异步更新**替换**同步的更新**。那么React15的架构支持异步更新么？让我们看一个例子：

::: details 乘法小Demo
[Demo](https://code.h5jun.com/jaluv/1/edit?html,js,output)

`state.count = 1`，每次点击按钮`state.count++`

列表中3个元素的值分别为1，2，3乘以`state.count`的结果 
:::

我用红色标注了更新的步骤。
<img :src="$withBase('/img/v15.png')" alt="更新流程">

我们可以看到，**Reconciler**和**Renderer**是交替工作的，当第一个`li`在页面上已经变化后，第二个`li`再进入**Reconciler**。

由于整个过程都是同步的，所以在用户看来所有DOM是同时更新的。

让我们看看在React15架构中如果中途中断更新会怎么样？
<img :src="$withBase('/img/dist.png')" alt="中断更新流程">

当第一个`li`完成更新时中断更新，即步骤3完成后中断更新，此时后面的步骤都还未执行。用户会在页面上看见更新不完全的DOM！

基于这个原因，`React`决定重写整个架构。

