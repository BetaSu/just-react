`Redux`的作者`Dan`加入`React`核心团队后的一大贡献就是“将`Redux`的理念带入`React`”。

这里面最显而易见的影响莫过于`useState`与`useReducer`这两个`Hook`。本质来说，`useState`只是预置了`reducer`的`useReducer`。

本节我们来学习`useState`与`useReducer`的实现。

## 流程概览

我们将这两个`Hook`的工作流程分为`申明阶段`和`调用阶段`，对于：

```js
function App() {
  const [state, dispatch] = useReducer(reducer, {a: 1});

  const [num, updateNum] = useState(0);
  
  return (
    <div>
      <button onClick={() => dispatch({type: 'a'})}>{state.a}</button>  
      <button onClick={() => updateNum(num => num + 1)}>{num}</button>  
    </div>
  )
}
```

`申明阶段`即`App`调用时，会依次执行`useReducer`与`useState`方法。

`调用阶段`即点击按钮后，`dispatch`或`updateNum`被调用时。

## 申明阶段

当`FunctionComponent`进入`render阶段`的`beginWork`时，会调用[renderWithHooks](https://github.com/acdlite/react/blob/1fb18e22ae66fdb1dc127347e169e73948778e5a/packages/react-reconciler/src/ReactFiberBeginWork.new.js#L1419)方法。

该方法内部会执行`FunctionComponent`对应函数（即`fiber.type`）。

> 你可以在[这里](https://github.com/acdlite/react/blob/1fb18e22ae66fdb1dc127347e169e73948778e5a/packages/react-reconciler/src/ReactFiberHooks.new.js#L415)看到这段逻辑

对于这两个`Hook`，他们的源码如下：

```js
function useState(initialState) {
  var dispatcher = resolveDispatcher();
  return dispatcher.useState(initialState);
}
function useReducer(reducer, initialArg, init) {
  var dispatcher = resolveDispatcher();
  return dispatcher.useReducer(reducer, initialArg, init);
}
```

正如上一节[dispatcher](./structure.html#dispatcher)所说，在不同场景下，同一个`Hook`会调用不同处理函数。

我们分别讲解`mount`与`update`两个场景。

### mount时

`mount`时，`useReducer`会调用[mountReducer](https://github.com/acdlite/react/blob/1fb18e22ae66fdb1dc127347e169e73948778e5a/packages/react-reconciler/src/ReactFiberHooks.new.js#L638)，`useState`会调用[mountState](https://github.com/acdlite/react/blob/1fb18e22ae66fdb1dc127347e169e73948778e5a/packages/react-reconciler/src/ReactFiberHooks.new.js#L1143)。

我们来简单对比这这两个方法：

```js
function mountState<S>(
  initialState: (() => S) | S,
): [S, Dispatch<BasicStateAction<S>>] {
  // 创建并返回当前的hook
  const hook = mountWorkInProgressHook();

  // ...赋值初始state

  // 创建queue
  const queue = (hook.queue = {
    pending: null,
    dispatch: null,
    lastRenderedReducer: basicStateReducer,
    lastRenderedState: (initialState: any),
  });

  // ...创建dispatch
  return [hook.memoizedState, dispatch];
}

function mountReducer<S, I, A>(
  reducer: (S, A) => S,
  initialArg: I,
  init?: I => S,
): [S, Dispatch<A>] {
  // 创建并返回当前的hook
  const hook = mountWorkInProgressHook();

  // ...赋值初始state

  // 创建queue
  const queue = (hook.queue = {
    pending: null,
    dispatch: null,
    lastRenderedReducer: reducer,
    lastRenderedState: (initialState: any),
  });

  // ...创建dispatch
  return [hook.memoizedState, dispatch];
}
```

其中`mountWorkInProgressHook`方法会创建并返回对应`hook`，对应`极简Hooks实现`中`useState`方法的`isMount`逻辑部分。

可以看到，`mount`时这两个`Hook`的唯一区别为`queue`参数的`lastRenderedReducer`字段。

`queue`的数据结构如下：

```js
const queue = (hook.queue = {
  // 与极简实现中的同名字段意义相同，保存update对象
  pending: null,
  // 保存dispatchAction.bind()的值
  dispatch: null,
  // 上一次render时使用的reducer
  lastRenderedReducer: reducer,
  // 上一次render时的state
  lastRenderedState: (initialState: any),
});
```

其中，`useReducer`的`lastRenderedReducer`为传入的`reducer`参数。`useState`的`lastRenderedReducer`为`basicStateReducer`。

`basicStateReducer`方法如下：

```js
function basicStateReducer<S>(state: S, action: BasicStateAction<S>): S {
  return typeof action === 'function' ? action(state) : action;
}
```

可见，`useState`即`reducer`参数为`basicStateReducer`的`useReducer`。

`mount`时的整体运行逻辑与`极简实现`的`isMount`逻辑类似，你可以对照着看。

### update时

如果说`mount`时这两者还有区别，那`update`时，`useReducer`与`useState`调用的则是同一个函数[updateReducer](https://github.com/acdlite/react/blob/1fb18e22ae66fdb1dc127347e169e73948778e5a/packages/react-reconciler/src/ReactFiberHooks.new.js#L665)。

```js
function updateReducer<S, I, A>(
  reducer: (S, A) => S,
  initialArg: I,
  init?: I => S,
): [S, Dispatch<A>] {
  // 获取当前hook
  const hook = updateWorkInProgressHook();
  const queue = hook.queue;
  
  queue.lastRenderedReducer = reducer;

  // ...同update与updateQueue类似的更新逻辑

  const dispatch: Dispatch<A> = (queue.dispatch: any);
  return [hook.memoizedState, dispatch];
}
```

整个流程可以概括为一句话：

> 找到对应的`hook`，根据`update`计算该`hook`的新`state`并返回。

`mount`时获取当前`hook`使用的是`mountWorkInProgressHook`，而`update`时使用的是`updateWorkInProgressHook`，这里的原因是： 

- `mount`时可以确定是调用`ReactDOM.render`或相关初始化`API`产生的`更新`，只会执行一次。

- `update`可能是在事件回调或副作用中触发的`更新`或者是`render阶段`触发的`更新`，为了避免组件无限循环`更新`，后者需要区别对待。

举个`render阶段`触发的`更新`的例子：

```js
function App() {
  const [num, updateNum] = useState(0);
  
  updateNum(num + 1);

  return (
    <button onClick={() => updateNum(num => num + 1)}>{num}</button>  
  )
}
```

在这个例子中，`App`调用时，代表已经进入`render阶段`执行`renderWithHooks`。

在`App`内部，调用`updateNum`会触发一次`更新`。如果不对这种情况下触发的更新作出限制，那么这次`更新`会开启一次新的`render阶段`，最终会无限循环更新。

基于这个原因，`React`用一个标记变量`didScheduleRenderPhaseUpdate`判断是否是`render阶段`触发的更新。

`updateWorkInProgressHook`方法也会区分这两种情况来获取对应`hook`。

获取对应`hook`，接下来会根据`hook`中保存的`state`计算新的`state`，这个步骤同[Update一节](../state/update.html)一致。

## 调用阶段

调用阶段会执行[dispatchAction](https://github.com/acdlite/react/blob/1fb18e22ae66fdb1dc127347e169e73948778e5a/packages/react-reconciler/src/ReactFiberHooks.new.js#L1662)，此时该`FunctionComponent`对应的`fiber`以及`hook.queue`已经通过调用`bind`方法预先作为参数传入。

```js
function dispatchAction(fiber, queue, action) {

  // ...创建update
  var update = {
    eventTime: eventTime,
    lane: lane,
    suspenseConfig: suspenseConfig,
    action: action,
    eagerReducer: null,
    eagerState: null,
    next: null
  }; 

  // ...将update加入queue.pending
  
  var alternate = fiber.alternate;

  if (fiber === currentlyRenderingFiber$1 || alternate !== null && alternate === currentlyRenderingFiber$1) {
    // render阶段触发的更新
    didScheduleRenderPhaseUpdateDuringThisPass = didScheduleRenderPhaseUpdate = true;
  } else {
    if (fiber.lanes === NoLanes && (alternate === null || alternate.lanes === NoLanes)) {
      // ...fiber的updateQueue为空，优化路径
    }

    scheduleUpdateOnFiber(fiber, lane, eventTime);
  }
}
```

整个过程可以概括为：

> 创建`update`，将`update`加入`queue.pending`中，并开启调度。

这里值得注意的是`if...else...`逻辑，其中：

```js
if (fiber === currentlyRenderingFiber$1 || alternate !== null && alternate === currentlyRenderingFiber$1)
```

`currentlyRenderingFiber`即`workInProgress`，`workInProgress`存在代表当前处于`render阶段`。

触发`更新`时通过`bind`预先保存的`fiber`与`workInProgress`全等，代表本次`更新`发生于`FunctionComponent`对应`fiber`的`render阶段`。

所以这是一个`render阶段`触发的`更新`，需要标记变量`didScheduleRenderPhaseUpdate`，后续单独处理。

再来关注：

```js
if (fiber.lanes === NoLanes && (alternate === null || alternate.lanes === NoLanes))
```

`fiber.lanes`保存`fiber`上存在的`update`的`优先级`。

`fiber.lanes === NoLanes`意味着`fiber`上不存在`update`。

我们已经知道，通过`update`计算`state`发生在`申明阶段`，这是因为该`hook`上可能存在多个不同`优先级`的`update`，最终`state`的值由多个`update`共同决定。

但是当`fiber`上不存在`update`，则`调用阶段`创建的`update`为该`hook`上第一个`update`，在`申明阶段`计算`state`时也只依赖于该`update`，完全不需要进入`申明阶段`再计算`state`。

这样做的好处是：如果计算出的`state`与该`hook`之前保存的`state`一致，那么完全不需要开启一次调度。即使计算出的`state`与该`hook`之前保存的`state`不一致，在`申明阶段`也可以直接使用`调用阶段`已经计算出的`state`。

> 你可以在[这里](https://github.com/acdlite/react/blob/1fb18e22ae66fdb1dc127347e169e73948778e5a/packages/react-reconciler/src/ReactFiberHooks.new.js#L1727)看到这段提前计算`state`的逻辑

## 小Tip

我们通常认为，`useReducer(reducer, initialState)`的传参为初始化参数，在以后的调用中都不可变。

但是在`updateReducer`方法中，可以看到`lastRenderedReducer`在每次调用时都会重新赋值。

```js
function updateReducer(reducer, initialArg, init) {
  // ...

  queue.lastRenderedReducer = reducer;

  // ...
```

也就是说，`reducer`参数是随时可变的。

::: details reducer可变Demo
每秒`useReducer`使用的`reducer`会改变一次

点击按钮后会随时间不同会出现`+1`或`-1`的效果

[关注公众号](../me.html)，后台回复**582**获得在线Demo地址
:::