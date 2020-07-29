在上一节我们实现了一个极简的`useState`，了解了`Hooks`的运行原理。

本节我们讲解`Hooks`的数据结构，为后面介绍具体的`hook`打下基础。

## dispatcher

在上一节的极简`useState`实现中，使用`isMount`变量区分`mount`与`update`。

在真实的`Hooks`中，组件`mount`时的`hook`与`update`时的`hook`来源于不同的对象，这类对象在源码中被称为`dispatcher`。

```js
// mount时的Dispatcher
const HooksDispatcherOnMount: Dispatcher = {
  useCallback: mountCallback,
  useContext: readContext,
  useEffect: mountEffect,
  useImperativeHandle: mountImperativeHandle,
  useLayoutEffect: mountLayoutEffect,
  useMemo: mountMemo,
  useReducer: mountReducer,
  useRef: mountRef,
  useState: mountState,
  // ...省略
};

// update时的Dispatcher
const HooksDispatcherOnUpdate: Dispatcher = {
  useCallback: updateCallback,
  useContext: readContext,
  useEffect: updateEffect,
  useImperativeHandle: updateImperativeHandle,
  useLayoutEffect: updateLayoutEffect,
  useMemo: updateMemo,
  useReducer: updateReducer,
  useRef: updateRef,
  useState: updateState,
  // ...省略
};
```

可见，`mount`时调用的`hook`和`update`时调用的`hook`其实是两个不同的函数。

在`FunctionComponent` `render`前，会根据`FunctionComponent`对应`fiber`的以下条件区分`mount`与`update`。

```js
current === null || current.memoizedState === null
```

并将不同情况对应的`dispatcher`赋值给全局变量`ReactCurrentDispatcher`的`current`属性。
 
```js
ReactCurrentDispatcher.current =
      current === null || current.memoizedState === null
        ? HooksDispatcherOnMount
        : HooksDispatcherOnUpdate;  
```
 
<!-- react17-alpha -->
> 你可以在[这里](https://github.com/acdlite/react/blob/1fb18e22ae66fdb1dc127347e169e73948778e5a/packages/react-reconciler/src/ReactFiberHooks.new.js#L409)看到这行代码

在`FunctionComponent` `render`时，会从`ReactCurrentDispatcher.current`（即当前`dispatcher`）中寻找需要的`hook`。

换言之，不同的调用栈上下文为`ReactCurrentDispatcher.current`赋值不同的`dispatcher`，则`FunctionComponent` `render`时调用的`hook`也是不同的函数。

> 除了这两个`dispatcher`，你可以在[这里](https://github.com/acdlite/react/blob/1fb18e22ae66fdb1dc127347e169e73948778e5a/packages/react-reconciler/src/ReactFiberHooks.new.js#L1775)看到其他`dispatcher`定义

## 一个dispatcher使用场景

 当错误的书写了嵌套形式的`hook`，如：

```js
useEffect(() => {
  useState(0);
})
```

此时`ReactCurrentDispatcher.current`已经指向`ContextOnlyDispatcher`，所以调用`useState`实际会调用`throwInvalidHookError`，直接抛出异常。

```js
export const ContextOnlyDispatcher: Dispatcher = {
  useCallback: throwInvalidHookError,
  useContext: throwInvalidHookError,
  useEffect: throwInvalidHookError,
  useImperativeHandle: throwInvalidHookError,
  useLayoutEffect: throwInvalidHookError,
  // ...省略
```

> 你可以在[这里](https://github.com/acdlite/react/blob/1fb18e22ae66fdb1dc127347e169e73948778e5a/packages/react-reconciler/src/ReactFiberHooks.new.js#L458)看到这段逻辑

## Hook的数据结构

接下来我们学习`hook`的数据结构。

```js
const hook: Hook = {
  memoizedState: null,

  baseState: null,
  baseQueue: null,
  queue: null,

  next: null,
};
```

> 你可以在[这里](https://github.com/acdlite/react/blob/1fb18e22ae66fdb1dc127347e169e73948778e5a/packages/react-reconciler/src/ReactFiberHooks.new.js#L546)看到创建`hook`的逻辑


其中除`memoizedState`以外字段的意义与上一章介绍的[updateQueue](../state/update.html#updatequeue)类似。

## memoizedState

::: warning 注意
`hook`与`FunctionComponent fiber`都存在`memoizedState`属性，不要混淆他们的概念。

- `fiber.memoizedState`：`FunctionComponent`对应`fiber`保存的`Hooks`链表。

- `hook.memoizedState`：`Hooks`链表中保存的单一`hook`对应的数据。
:::

不同类型`hook`的`memoizedState`保存不同类型数据，具体如下：

- useState：对于`const [state, updateState] = useState(initialState)`，`memoizedState`保存`state`的值

- useReducer：对于`const [state, dispatch] = useReducer(reducer, {});`，`memoizedState`保存`state`的值

- useEffect：`memoizedState`保存包含`useEffect回调函数`、`依赖项`等的链表数据结构`effect`，你可以在[这里](https://github.com/acdlite/react/blob/1fb18e22ae66fdb1dc127347e169e73948778e5a/packages/react-reconciler/src/ReactFiberHooks.new.js#L1181)看到`effect`的创建过程。`effect`链表同时会保存在`fiber.updateQueue`中

- useRef：对于`useRef(1)`，`memoizedState`保存`{current: 1}`

- useMemo：对于`useMemo(callback, [depA])`，`memoizedState`保存`[callback(), depA]`

- useCallback：对于`useCallback(callback, [depA])`，`memoizedState`保存`[callback, depA]`。与`useMemo`的区别是，`useCallback`保存的是`callback`函数本身，而`useMemo`保存的是`callback`函数的执行结果

有些`hook`是没有`memoizedState`的，比如：

- useContext

