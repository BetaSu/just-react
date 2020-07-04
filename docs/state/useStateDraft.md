### FunctionComponent

`hooks`使`FunctionComponent`可以获得`state`，他使用一种与`ClassComponent`不同的`Update`。

对应的结构如下：

```js
const update: Update<S, A> = {
  eventTime,
  lane,
  suspenseConfig,
  action,
  eagerReducer: null,
  eagerState: null,

  next: (null: any)
};
```

> `Update`在`dispatchAction`方法内创建，你可以从[这里](https://github.com/facebook/react/blob/master/packages/react-reconciler/src/ReactFiberHooks.new.js#L1661)看到`Update`创建的逻辑

可以看到，大部分字段与`ClassComponent Update`相同。不同的字段意义如下：

- `eagerReducer`与`eagerState`：这两个字段与调用流程优化有关，可以理解为：通过提前计算本次更新的`state`，如果该`state`与上次更新的`state`相同则可以取消本次更新的调度。

- action：类似`ClassComponent Update`的`payload`。对于`[state, updateState] = useState()`来说，`payload`为调用`updateState`传递的参数。


### FunctionComponent

```js
const queue = (hook.queue = {
  pending: null,
  dispatch: null,
  lastRenderedReducer: basicStateReducer,
  lastRenderedState: (initialState: any),
});
```

> `useState`的`queue`在`mountState`方法内创建，你可以从[这里](https://github.com/facebook/react/blob/master/packages/react-reconciler/src/ReactFiberHooks.new.js#L1141)看到`queue`创建的逻辑