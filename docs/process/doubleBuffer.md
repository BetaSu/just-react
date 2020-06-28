通过本章的学习，我们了解了一棵`Fiber树`是如何构建的，每次更新都会构建一棵新的`Fiber树`。

那么如何在不同的`Fiber树`之间切换呢？这需要用到被称为“双缓存”的技术。

## 什么是“双缓存”

当我们用`canvas`绘制动画，每一帧绘制前都会调用`ctx.clearRect`清除上一帧的画面。如果当前帧画面计算量比较大，导致清除上一帧画面到绘制当前帧画面之间有较长间隙，就会出现白屏闪烁。

为了解决这个问题，我们可以在内存中绘制当前帧动画，绘制完毕后直接用当前帧替换上一帧画面，由于省去了两帧替换间的计算时间，不会出现屏闪的情况。这种**在内存中构建并直接替换**的技术叫做[双缓存](https://baike.baidu.com/item/%E5%8F%8C%E7%BC%93%E5%86%B2)。

`React`使用“双缓存”来完成`Fiber树`的构建与替换。

## 双缓存Fiber树

在`React`中最多会同时存在两棵`Fiber树`。当前屏幕上显示内容对应的`Fiber树`称为`current Fiber树`，正在内存中构建的`Fiber树`称为`workInProgress Fiber树`。`React`应用的根节点通过`current`指针在不同`Fiber树`的`rootFiber`间切换来实现`Fiber树`的切换。

当`workInProgress Fiber树`构建完成交给`Renderer`渲染在页面上后，`current`指针指向`workInProgress Fiber树`，此时`workInProgress Fiber树`就变为`current Fiber树`。下一次构建又会产生新的`workInProgress Fiber树`。

接下来我们以具体例子讲解。

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

1. 首次执行`ReactDOM.render`会创建`rootFiberNode`和`rootFiber`。其中`rootFiberNode`是整个应用的根节点，`rootFiber`是`current Fiber树`的根节点。

```js
// current指向当前fiber树的根fiber
rootFiberNode.current = rootFiber;
```

由于是首屏渲染，`rootFiber.child === null`

<img :src="$withBase('/img/rootfiber.png')" alt="rootFiber">

2. 接下来进入`render阶段`在内存中构建`workInProgress Fiber树`。其中每个正在执行`beginWork`或`completeWork`的节点被称为`workInProgress`。

在根据`workInProgress`创建`Fiber`节点的过程中，`rootFiber`比较特殊。因为`current Fiber树`中已经存在`rootFiber`，这也是我们在[beginWork小节](./beginWork.html#effecttag)介绍的`mount`时根`Fiber`节点会赋值`Placement effectTag的原因。

<img :src="$withBase('/img/workInProgressFiber.png')" alt="workInProgressFiber">

3. 图中右侧已构建完的`workInProgress Fiber树`在`commit阶段`渲染到页面后变为`current Fiber 树`。

<img :src="$withBase('/img/wipTreeFinish.png')" alt="workInProgressFiberFinish">

## update时

接下来我们点击`p节点`触发状态改变，这会开启`render阶段`构建一棵`workInProgress Fiber 树`。

<img :src="$withBase('/img/wipTreeUpdate.png')" alt="wipTreeUpdate">

每个`Fiber`节点的`alternate`指向前一次更新时同一个`Fiber`节点。

`workInProgress Fiber 树`在`render阶段`完成构建后进入`commit阶段`渲染到页面上。渲染完毕后，`workInProgress Fiber 树`变为`current Fiber 树`。

<img :src="$withBase('/img/currentTreeUpdate.png')" alt="currentTreeUpdate">