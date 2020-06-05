TODO
<!-- 回归到代码逻辑上，`React`需要区别对待不同任务优先级。

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

在下篇文章中，我们会讲解基于 调度器——协调器——渲染器 架构，一次典型的渲染是如何实现的。 -->