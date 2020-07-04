软件的设计是为了服务理念。只有懂了设计理念，才能明白为了实现这样的理念需要如何架构。所以，在我们深入源码架构之前，先来聊聊`React`理念。

## React理念
我们可以从[官网](https://zh-hans.reactjs.org/docs/thinking-in-react.html)看到`React`的理念：
> 我们认为，React 是用 JavaScript 构建**快速响应**的大型 Web 应用程序的首选方式。它在 Facebook 和 Instagram 上表现优秀。

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

而在`React`中，以上代码可以写成如下`JSX`：

```jsx
<ul>{
    data.map((name, i) => <li>{i !== 1 ? i : name}</li>)
}</ul>
```
由于语法的灵活，在编译时无法区分可能变化的部分。所以在运行时，`React`需要遍历每个`li`，判断其数据是否更新。

基于以上原因，相比于`Vue`、`Angular`，缺少编译时优化手段的`React`为了**速度快**需要在运行时做出更多努力。

比如

- 使用`PureComponent`或`React.memo`构建组件
- 使用`shouldComponentUpdate`生命周期钩子
- 渲染列表时使用`key`
- 使用`useCallback`和`useMemo`缓存函数和变量

由开发者来显式的告诉`React`哪些组件不需要重复计算、可以复用。

在后面源码的学习中，我们会看到这些优化手段是如何起作用的。比如经过优化后，`React`会通过[bailoutOnAlreadyFinishedWork方法](https://github.com/facebook/react/blob/master/packages/react-reconciler/src/ReactFiberBeginWork.new.js#L2964)跳过一些本次更新不需要处理的任务。


## 理解“响应自然”

该如何理解“响应自然”？React给出的答案是[将人机交互研究的结果整合到真实的 UI 中](https://zh-hans.reactjs.org/docs/concurrent-mode-intro.html#putting-research-into-production)。

设想以下场景：

<img :src="$withBase('/img/searchbox.gif')" alt="搜索框">
<!-- ![搜索框](/img/searchbox.gif) -->

有一个地址搜索框，在输入字符时会实时显示地址匹配结果。

当用户输入过快时可能输入变得不是那么流畅。这是由于下拉列表的更新会阻塞线程。我们一般是通过`debounce`或 `throttle`来减少输入内容时触发回调的次数来解决这个问题。

但这只是治标不治本。只要组件的更新操作是同步的，那么当更新开始直到渲染完毕前，组件中总会有一定数量的工作占用线程，浏览器没有空闲时间绘制UI，造成卡顿。

> React核心团队成员Dan在介绍React为什么会异步（[Concurrent Mode](https://zh-hans.reactjs.org/docs/concurrent-mode-intro.html)）更新组件时说：
<img :src="$withBase('/img/update.png')" alt="Dan关于用户体验的思考">
<!-- ![Dan关于用户体验的思考](/img/update.png) -->

让我们从“响应自然”的角度考虑：当输入字符时，用户是否在意下拉框能在一瞬间就更新？

事实是：并不在意。

如果我们能稍稍延迟下拉框更新的时间，为浏览器留出时间渲染UI，让输入不卡顿。这样的体验是更**自然**的。

为了实现这个目标，需要将**同步的更新**变为**可中断的异步更新**。

在浏览器每一帧的时间中，预留一些时间给JS线程，`React`利用这部分时间更新组件（可以看到，在[源码](https://github.com/facebook/react/blob/4c7036e807fa18a3e21a5182983c7c0f05c5936e/packages/scheduler/src/forks/SchedulerHostConfig.default.js#L119)中，预留的初始时间是5ms）。

当预留的时间不够用时，`React`将线程控制权交还给浏览器使其有时间渲染UI，`React`则等待下一帧时间到来继续被中断的工作。


::: details 同步更新 vs 异步更新 Demo
我们有个更新很耗时的大列表，让我们看看**同步更新**和**异步更新**时，输入框的响应速度

[同步更新](https://codesandbox.io/s/pensive-shirley-wkp46)

[异步更新](https://codesandbox.io/s/infallible-dewdney-9fkv9)

:::

可以从Demo看到，当牺牲了列表的更新速度，`React`大幅提高了输入响应速度，使交互更自然。

## 总结

通过以上内容，我们可以看到，`React`为了践行“构建**快速响应**的大型 Web 应用程序”理念做出的努力。

这其中有些优化手段可以在现有架构上增加，而有些（如：异步可中断更新）只能重构整个架构实现。

最后再让我们看看，Dan回答网友关于`React`发展方向的提问：

<img :src="$withBase('/img/ques1.png')" alt="用户向Dan提问">
<img :src="$withBase('/img/ans1.png')" alt="Dan回答">
<!-- ![用户向Dan提问](/img/ques1.png)
![Dan回答](/img/ans1.png) -->

相比于新增feature，`React`更在意底层抽象的表现力。结合理念，相信你已经明白这意味着什么了。

## 参考资料

[「英文 计划翻译」尤雨溪论JavaScript框架设计哲学：平衡](https://www.bilibili.com/video/BV134411c7Sk?from=search&seid=17404881291635824595)
