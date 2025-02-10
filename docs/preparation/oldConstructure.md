在上一节中我们了解了`React`的理念，简单概括就是**快速响应**。

`React`从 v15 升级到 v16 后重构了整个架构。本节我们聊聊 v15，看看他为什么不能满足**快速响应**的理念，以至于被重构。

## React15 架构

React15 架构可以分为两层：

- Reconciler（协调器）—— 负责找出变化的组件
- Renderer（渲染器）—— 负责将变化的组件渲染到页面上

### Reconciler（协调器）

我们知道，在`React`中可以通过`this.setState`、`this.forceUpdate`、`ReactDOM.render`等 API 触发更新。

每当有更新发生时，**Reconciler**会做如下工作：

- 调用函数组件、或 class 组件的`render`方法，将返回的 JSX 转化为虚拟 DOM
- 将虚拟 DOM 和上次更新时的虚拟 DOM 对比
- 通过对比找出本次更新中变化的虚拟 DOM
- 通知**Renderer**将变化的虚拟 DOM 渲染到页面上

> 你可以在[这里](https://zh-hans.reactjs.org/docs/codebase-overview.html#reconcilers)看到`React`官方对**Reconciler**的解释

### Renderer（渲染器）

由于`React`支持跨平台，所以不同平台有不同的**Renderer**。我们前端最熟悉的是负责在浏览器环境渲染的**Renderer** —— [ReactDOM](https://www.npmjs.com/package/react-dom)。

除此之外，还有：

- [ReactNative](https://www.npmjs.com/package/react-native)渲染器，渲染 App 原生组件
- [ReactTest](https://www.npmjs.com/package/react-test-renderer)渲染器，渲染出纯 Js 对象用于测试
- [ReactArt](https://www.npmjs.com/package/react-art)渲染器，渲染到 Canvas, SVG 或 VML (IE8)

在每次更新发生时，**Renderer**接到**Reconciler**通知，将变化的组件渲染在当前宿主环境。

> 你可以在[这里](https://zh-hans.reactjs.org/docs/codebase-overview.html#renderers)看到`React`官方对**Renderer**的解释

## React15 架构的缺点

在**Reconciler**中，`mount`的组件会调用[mountComponent](https://github.com/facebook/react/blob/15-stable/src/renderers/dom/shared/ReactDOMComponent.js#L498)，`update`的组件会调用[updateComponent](https://github.com/facebook/react/blob/15-stable/src/renderers/dom/shared/ReactDOMComponent.js#L877)。这两个方法都会递归更新子组件。

### 递归更新的缺点

由于递归执行，所以更新一旦开始，中途就无法中断。当层级很深时，递归更新时间超过了 16ms，用户交互就会卡顿。

在上一节中，我们已经提出了解决办法——用**可中断的异步更新**代替**同步的更新**。那么 React15 的架构支持异步更新么？让我们看一个例子：

::: details 乘法小 Demo
[关注公众号 魔术师卡颂](../me.html)，后台回复**222**获得在线 Demo 地址

初始化时`state.count = 1`，每次点击按钮`state.count++`

列表中 3 个元素的值分别为 1，2，3 乘以`state.count`的结果
:::

我用红色标注了更新的步骤。
<img :src="$withBase('/img/v15.png')" alt="更新流程">

我们可以看到，**Reconciler**和**Renderer**是交替工作的，当第一个`li`在页面上已经变化后，第二个`li`再进入**Reconciler**。

由于整个过程都是同步的，所以在用户看来所有 DOM 是同时更新的。

接下来，让我们模拟一下，如果中途中断更新会怎么样？

:::danger 注意
以下是我们模拟中断的情况，实际上`React15`并不会中断进行中的更新
:::

<img :src="$withBase('/img/dist.png')" alt="中断更新流程">

当第一个`li`完成更新时中断更新，即步骤 3 完成后中断更新，此时后面的步骤都还未执行。

用户本来期望`123`变为`246`。实际却看见更新不完全的 DOM！（即`223`）

基于这个原因，`React`决定重写整个架构。
