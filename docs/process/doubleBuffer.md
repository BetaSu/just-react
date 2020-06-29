通过上一节的学习，我们了解了`Fiber`是什么，知道`Fiber节点`可以保存对应的`DOM节点`。

相应的，`Fiber节点`构成的`Fiber树`就对应`DOM树`。

那么如何更新`DOM`呢？这需要用到被称为“双缓存”的技术。

## 什么是“双缓存”

当我们用`canvas`绘制动画，每一帧绘制前都会调用`ctx.clearRect`清除上一帧的画面。如果当前帧画面计算量比较大，导致清除上一帧画面到绘制当前帧画面之间有较长间隙，就会出现白屏闪烁。

为了解决这个问题，我们可以在内存中绘制当前帧动画，绘制完毕后直接用当前帧替换上一帧画面，由于省去了两帧替换间的计算时间，不会出现从白屏到出现画面的闪烁情况。

这种**在内存中构建并直接替换**的技术叫做[双缓存](https://baike.baidu.com/item/%E5%8F%8C%E7%BC%93%E5%86%B2)。

`React`使用“双缓存”来完成`Fiber树`的构建与替换——对应着`DOM树`的创建与更新。

## 双缓存Fiber树

在`React`中最多会同时存在两棵`Fiber树`。当前屏幕上显示内容对应的`Fiber树`称为`current Fiber树`，正在内存中构建的`Fiber树`称为`workInProgress Fiber树`。

`current Fiber树`中的`Fiber节点`被称为`current fiber`，`workInProgress Fiber树`中的`Fiber节点`被称为`workInProgress fiber`，他们通过`alternate`属性连接。

```js
currentFiber.alternate === workInProgressFiber;
workInProgressFiber.alternate === currentFiber;
```

`React`应用的根节点通过`current`指针在不同`Fiber树`的`rootFiber`间切换来实现`Fiber树`的切换。

当`workInProgress Fiber树`构建完成交给`Renderer`渲染在页面上后，应用根节点的`current`指针指向`workInProgress Fiber树`，此时`workInProgress Fiber树`就变为`current Fiber树`。

每次状态更新都会产生新的`workInProgress Fiber树`，通过`current`与`workInProgress`的替换，完成`DOM`更新。

接下来我们以具体例子讲解`mount时`、`update时`的构建/替换流程。

## mount时

考虑如下例子：

```js
function App() {
  const [num, add] = useState(0);
  return (
    <p onClick={() => add(num + 1)}>{num}</p>
  )
}

ReactDOM.render(<App/>, document.getElementById('root'));
```

1. 首次执行`ReactDOM.render`会创建`rootFiberNode`和`rootFiber`。其中`rootFiberNode`是整个应用的根节点，`rootFiber`是`<App/>`所在组件树的根节点。

之所以要区分`rootFiberNode`与`rootFiber`，是因为在应用中我们可以多次调用`ReactDOM.render`渲染不同的组件树，他们会拥有不同的`rootFiber`。但是整个应用的根节点只有一个，那就是`rootFiberNode`。

<img :src="$withBase('/img/rootfiber.png')" alt="rootFiber">

```js
// current指向当前fiber树的根fiber
rootFiberNode.current = rootFiber;
```

由于是首屏渲染，页面中还没有任何`DOM`。所以`rootFiber.child === null`，即`current Fiber树`为空。


2. 接下来进入`render阶段`在内存中依次创建`workInProgress fiber`并连接在一起构建`workInProgress Fiber树`。（图中右侧为内存中构建的树，左侧为页面显示的树）

<img :src="$withBase('/img/workInProgressFiber.png')" alt="workInProgressFiber">

3. 图中右侧已构建完的`workInProgress Fiber树`在`commit阶段`渲染到页面。此时`DOM`更新为右侧树对应的样子。`rootFiberNode`的`current`指针指向`workInProgress Fiber树`使其变为`current Fiber 树`。

<img :src="$withBase('/img/wipTreeFinish.png')" alt="workInProgressFiberFinish">

## update时

1. 接下来我们点击`p节点`触发状态改变，这会开启一次新的`render阶段`并构建一棵`workInProgress Fiber 树`。

<img :src="$withBase('/img/wipTreeUpdate.png')" alt="wipTreeUpdate">

其中很多`workInProgress fiber`的创建可以复用`current Fiber树`对应的节点数据。

> 这个决定是否复用的过程就是Diff算法，后面章节会详细讲解

2. `workInProgress Fiber 树`在`render阶段`完成构建后进入`commit阶段`渲染到页面上。渲染完毕后，`workInProgress Fiber 树`变为`current Fiber 树`。

<img :src="$withBase('/img/currentTreeUpdate.png')" alt="currentTreeUpdate">

## 总结

本文介绍了`Fiber树`的构建与替换过程，这个过程伴随着`DOM`的更新。

那么在构建过程中每个`Fiber节点`是如何创建的呢？我们会在下一节讲解。