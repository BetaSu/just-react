软件的设计是为了服务理念。只有懂了设计理念，才能明白为了实现这样的理念需要如何架构。

所以，在我们深入源码架构之前，先来聊聊`React`理念。

## React理念
我们可以从[官网](https://zh-hans.reactjs.org/docs/thinking-in-react.html)看到`React`的理念：
> 我们认为，React 是用 JavaScript 构建**快速响应**的大型 Web 应用程序的首选方式。它在 Facebook 和 Instagram 上表现优秀。

可见，关键是实现`快速响应`。那么制约`快速响应`的因素是什么呢？

我们日常使用App，浏览网页时，有两类场景会制约`快速响应`：

- 当遇到大计算量的操作或者设备性能不足使页面掉帧，导致卡顿。

- 发送网络请求后，由于需要等待数据返回才能进一步操作导致不能快速响应。

这两类场景可以概括为：

- CPU的瓶颈

- IO的瓶颈

`React`是如何解决这两个瓶颈的呢？

## CPU的瓶颈

当项目变得庞大、组件数量繁多时，就容易遇到CPU的瓶颈。

考虑如下Demo，我们向视图中渲染3000个`li`：

```js
function App() {
  const len = 3000;
  return (
    <ul>
      {Array(len).fill(0).map((_, i) => <li>{i}</li>)}
    </ul>
  );
}

const rootEl = document.querySelector("#root");
ReactDOM.render(<App/>, rootEl);  
```

主流浏览器刷新频率为60Hz，即每（1000ms / 60Hz）16.6ms浏览器刷新一次。

我们知道，JS可以操作DOM，`GUI渲染线程`与`JS线程`是互斥的。所以**JS脚本执行**和**浏览器布局、绘制**不能同时执行。

在每16.6ms时间内，需要完成如下工作：

```
JS脚本执行 -----  样式布局 ----- 样式绘制
```

当JS执行时间过长，超出了16.6ms，这次刷新就没有时间执行**样式布局**和**样式绘制**了。

在Demo中，由于组件数量繁多（3000个），JS脚本执行时间过长，页面掉帧，造成卡顿。

可以从打印的执行堆栈图看到，JS执行时间为73.65ms，远远多于一帧的时间。

<img :src="$withBase('/img/long-task.png')" alt="长任务">

如何解决这个问题呢？

答案是：在浏览器每一帧的时间中，预留一些时间给JS线程，`React`利用这部分时间更新组件（可以看到，在[源码](https://github.com/facebook/react/blob/1fb18e22ae66fdb1dc127347e169e73948778e5a/packages/scheduler/src/forks/SchedulerHostConfig.default.js#L119)中，预留的初始时间是5ms）。

当预留的时间不够用时，`React`将线程控制权交还给浏览器使其有时间渲染UI，`React`则等待下一帧时间到来继续被中断的工作。

> 这种将长任务分拆到每一帧中，像蚂蚁搬家一样一次执行一小段任务的操作，被称为`时间切片`（time slice）

接下来我们开启`Concurrent Mode`（后续章节会讲到，当前你只需了解开启后会启用`时间切片`）：

```js {3}
// 通过使用ReactDOM.unstable_createRoot开启Concurrent Mode
// ReactDOM.render(<App/>, rootEl);  
ReactDOM.unstable_createRoot(rootEl).render(<App/>);
```

此时我们的长任务被拆分到每一帧不同的`task`中，`JS脚本`执行时间大体在`5ms`左右，这样浏览器就有剩余时间执行**样式布局**和**样式绘制**，减少掉帧的可能性。

<img :src="$withBase('/img/time-slice.png')" alt="长任务">

所以，解决`CPU瓶颈`的关键是实现`时间切片`，而`时间切片`的关键是：将**同步的更新**变为**可中断的异步更新**。

::: details 同步更新 vs 异步更新 Demo
我们有个更新很耗时的大列表，让我们看看**同步更新**和**异步更新**时，输入框的响应速度

[关注公众号](../me.html)，后台回复**323**获得在线Demo地址

可以从Demo看到，当牺牲了列表的更新速度，`React`大幅提高了输入响应速度，使交互更自然。

:::

## IO的瓶颈

`网络延迟`是前端开发者无法解决的。如何在`网络延迟`客观存在的情况下，减少用户对`网络延迟`的感知？

`React`给出的答案是[将人机交互研究的结果整合到真实的 UI 中](https://zh-hans.reactjs.org/docs/concurrent-mode-intro.html#putting-research-into-production)。

这里我们以业界人机交互最顶尖的苹果举例，在IOS系统中：

点击“设置”面板中的“通用”，进入“通用”界面：

<img  :src="$withBase('/img/legacy-move.gif')" alt="同步">

作为对比，再点击“设置”面板中的“Siri与搜索”，进入“Siri与搜索”界面：

<img  :src="$withBase('/img/concurrent-mov.gif')" alt="异步">

你能感受到两者体验上的区别么？

事实上，点击“通用”后的交互是同步的，直接显示后续界面。而点击“Siri与搜索”后的交互是异步的，需要等待请求返回后再显示后续界面。但从用户感知来看，这两者的区别微乎其微。

这里的窍门在于：点击“Siri与搜索”后，先在当前页面停留了一小段时间，这一小段时间被用来请求数据。

当“这一小段时间”足够短时，用户是无感知的。如果请求时间超过一个范围，再显示`loading`的效果。

试想如果我们一点击“Siri与搜索”就显示`loading`效果，即使数据请求时间很短，`loading`效果一闪而过。用户也是可以感知到的。

为此，`React`实现了[Suspense](https://zh-hans.reactjs.org/docs/concurrent-mode-suspense.html)功能及配套的`hook`——[useDeferredValue](https://zh-hans.reactjs.org/docs/concurrent-mode-reference.html#usedeferredvalue)。

而在源码内部，为了支持这些特性，同样需要将**同步的更新**变为**可中断的异步更新**。


## 总结

通过以上内容，我们可以看到，`React`为了践行“构建**快速响应**的大型 Web 应用程序”理念做出的努力。

其中的关键是解决CPU的瓶颈与IO的瓶颈。而落实到实现上，则需要将**同步的更新**变为**可中断的异步更新**。

## 参考资料

[「英文」尤雨溪论JavaScript框架设计哲学：平衡](https://www.bilibili.com/video/BV134411c7Sk?from=search&seid=17404881291635824595)
