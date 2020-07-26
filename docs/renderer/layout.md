该阶段之所以称为`layout`，因为该阶段的代码都是在`DOM`渲染完成（`mutation阶段`完成）后执行的。

该阶段触发的生命周期钩子和`hook`可以直接访问到已经改变后的`DOM`，即该阶段是可以参与`DOM layout`的阶段。

## 概览

与前两个阶段类似，`layout阶段`也是遍历`effectList`，执行函数。这里执行的是`commitLayoutEffects`。

```js
root.current = finishedWork;

nextEffect = firstEffect;
do {
  try {
    commitLayoutEffects(root, lanes);
  } catch (error) {
    invariant(nextEffect !== null, "Should be working on an effect.");
    captureCommitPhaseError(nextEffect, error);
    nextEffect = nextEffect.nextEffect;
  }
} while (nextEffect !== null);

nextEffect = null;
```

## commitLayoutEffects

代码如下：

> 你可以在[这里](https://github.com/facebook/react/blob/970fa122d8188bafa600e9b5214833487fbf1092/packages/react-reconciler/src/ReactFiberWorkLoop.new.js#L2302)看到`commitLayoutEffects`源码

```js
function commitLayoutEffects(root: FiberRoot, committedLanes: Lanes) {
  while (nextEffect !== null) {
    const effectTag = nextEffect.effectTag;

    // 调用生命周期钩子和hook
    if (effectTag & (Update | Callback)) {
      const current = nextEffect.alternate;
      commitLayoutEffectOnFiber(root, current, nextEffect, committedLanes);
    }

    // 赋值ref
    if (effectTag & Ref) {
      commitAttachRef(nextEffect);
    }

    nextEffect = nextEffect.nextEffect;
  }
}
```

`commitLayoutEffects`一共做了两件事：

1. commitLayoutEffectOnFiber（调用生命周期钩子和 hook）

2. commitAttachRef（赋值 ref）

## commitLayoutEffectOnFiber

`commitLayoutEffectOnFiber`方法会根据`fiber.tag`对不同类型的节点分别处理。

> 你可以在[这里](https://github.com/facebook/react/blob/970fa122d8188bafa600e9b5214833487fbf1092/packages/react-reconciler/src/ReactFiberCommitWork.new.js#L459)看到`commitLayoutEffectOnFiber`源码（`commitLayoutEffectOnFiber`为别名，方法原名为`commitLifeCycles`）

- 对于`ClassComponent`，他会通过`current === null?`区分是`mount`还是`update`，调用[`componentDidMount`](https://github.com/facebook/react/blob/970fa122d8188bafa600e9b5214833487fbf1092/packages/react-reconciler/src/ReactFiberCommitWork.new.js#L538)或[`componentDidUpdate`](https://github.com/facebook/react/blob/970fa122d8188bafa600e9b5214833487fbf1092/packages/react-reconciler/src/ReactFiberCommitWork.new.js#L592)。

触发`状态更新`的`this.setState`如果赋值了第二个参数`回调函数`，也会在此时调用。

```js
this.setState({ xxx: 1 }, () => {
  console.log("i am update~");
});
```

- 对于`FunctionComponent`，他会调用`useLayoutEffect hook`的回调函数。

在上一节介绍[Update effect](./mutation.html#update-effect)时介绍过，`mutation阶段`会执行`useLayoutEffect hook`的销毁函数。结合这里我们可以发现，`useLayoutEffect hook`从上一次更新的销毁函数调用到本次更新的回调函数调用是同步执行的。

而`useEffect`则需要先调度，在`commit阶段`完成后再异步执行。这就是`useLayoutEffect`与`useEffect`的区别。

- 对于`HostRoot`，即`rootFiber`，如果赋值了第三个参数`回调函数`，也会在此时调用。

```js
ReactDOM.render(<App />, document.querySelector("#root"), function() {
  console.log("i am mount~");
});
```

## commitAttachRef

`commitLayoutEffects`会做的第二件事是`commitAttachRef`。

> 你可以在[这里](https://github.com/facebook/react/blob/970fa122d8188bafa600e9b5214833487fbf1092/packages/react-reconciler/src/ReactFiberCommitWork.new.js#L823)看到`commitAttachRef`源码

```js
function commitAttachRef(finishedWork: Fiber) {
  const ref = finishedWork.ref;
  if (ref !== null) {
    const instance = finishedWork.stateNode;

    // 获取DOM实例
    let instanceToUse;
    switch (finishedWork.tag) {
      case HostComponent:
        instanceToUse = getPublicInstance(instance);
        break;
      default:
        instanceToUse = instance;
    }

    if (typeof ref === "function") {
      // 如果ref是函数形式，调用回调函数
      ref(instanceToUse);
    } else {
      // 如果ref是ref实例形式，赋值ref.current
      ref.current = instanceToUse;
    }
  }
}
```

代码逻辑很简单：获取`DOM`实例，更新`ref`。

## current Fiber树切换

至此，整个`layout阶段`就结束了。

在结束本节的学习前，我们关注下这行代码：

```js
root.current = finishedWork;
```

> 你可以在[这里](https://github.com/facebook/react/blob/970fa122d8188bafa600e9b5214833487fbf1092/packages/react-reconciler/src/ReactFiberWorkLoop.new.js#L2022)看到这行代码

在[双缓存机制一节](../process/doubleBuffer.html#什么是-双缓存)我们介绍过，`workInProgress Fiber树`在`commit阶段`完成渲染后会变为`current Fiber树`。这行代码的作用就是切换`rootFiberNode`指向的`current Fiber树`。

那么这行代码为什么在这里呢？（在`mutation阶段`结束后，`layout阶段`开始前。）

我们知道`componentWillUnmount`会在`mutation阶段`执行。此时`current Fiber树`还指向前一次更新的`Fiber树`，在生命周期钩子内获取的`DOM`还是更新前的。

`componentDidMount`和`componentDidUpdate`会在`layout阶段`执行。此时`current Fiber树`已经指向更新后的`Fiber树`，在生命周期钩子内获取的`DOM`就是更新后的。

## 总结

从这节我们学到，`layout阶段`会遍历`effectList`，依次执行`commitLayoutEffects`。该方法的主要工作为“根据`effectTag`调用不同的处理函数处理`Fiber`并更新`ref`。
