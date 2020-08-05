当我们有了前面知识的铺垫，就很容易理解`this.setState`的工作流程。

## 流程概览

可以看到，`this.setState`内会调用`this.updater.enqueueSetState`方法。

```js
Component.prototype.setState = function (partialState, callback) {
  if (!(typeof partialState === 'object' || typeof partialState === 'function' || partialState == null)) {
    {
      throw Error( "setState(...): takes an object of state variables to update or a function which returns an object of state variables." );
    }
  }
  this.updater.enqueueSetState(this, partialState, callback, 'setState');
};
```

> 你可以在[这里](https://github.com/facebook/react/blob/1fb18e22ae66fdb1dc127347e169e73948778e5a/packages/react/src/ReactBaseClasses.js#L57)看到这段代码

在`enqueueSetState`方法中就是我们熟悉的从`创建update`到`调度update`的流程了。

```js
enqueueSetState(inst, payload, callback) {
  // 通过组件实例获取对应fiber
  const fiber = getInstance(inst);

  const eventTime = requestEventTime();
  const suspenseConfig = requestCurrentSuspenseConfig();

  // 获取优先级
  const lane = requestUpdateLane(fiber, suspenseConfig);

  // 创建update
  const update = createUpdate(eventTime, lane, suspenseConfig);

  update.payload = payload;

  // 赋值回调函数
  if (callback !== undefined && callback !== null) {
    update.callback = callback;
  }

  // 将update插入updateQueue
  enqueueUpdate(fiber, update);
  // 调度update
  scheduleUpdateOnFiber(fiber, lane, eventTime);
}
```

> 你可以在[这里](https://github.com/facebook/react/blob/1fb18e22ae66fdb1dc127347e169e73948778e5a/packages/react-reconciler/src/ReactFiberClassComponent.old.js#L196)看到`enqueueSetState`代码

这里值得注意的是对于`ClassComponent`，`update.payload`为`this.setState`的第一个传参（即要改变的`state`）。

## this.forceUpdate

在`this.updater`上，除了`enqueueSetState`外，还存在`enqueueForceUpdate`，当我们调用`this.forceUpdate`时会调用他。

可以看到，除了赋值`update.tag = ForceUpdate;`以及没有`payload`外，其他逻辑与`this.setState`一致。

```js
enqueueForceUpdate(inst, callback) {
    const fiber = getInstance(inst);
    const eventTime = requestEventTime();
    const suspenseConfig = requestCurrentSuspenseConfig();
    const lane = requestUpdateLane(fiber, suspenseConfig);

    const update = createUpdate(eventTime, lane, suspenseConfig);

    // 赋值tag为ForceUpdate
    update.tag = ForceUpdate;

    if (callback !== undefined && callback !== null) {
      update.callback = callback;
    }

    enqueueUpdate(fiber, update);
    scheduleUpdateOnFiber(fiber, lane, eventTime);
  },
};
```

> 你可以在[这里](https://github.com/facebook/react/blob/1fb18e22ae66fdb1dc127347e169e73948778e5a/packages/react-reconciler/src/ReactFiberClassComponent.old.js#L260)看到`enqueueForceUpdate`代码

那么赋值`update.tag = ForceUpdate;`有何作用呢？

在判断`ClassComponent`是否需要更新时有两个条件需要满足：

```js
 const shouldUpdate =
  checkHasForceUpdateAfterProcessing() ||
  checkShouldComponentUpdate(
    workInProgress,
    ctor,
    oldProps,
    newProps,
    oldState,
    newState,
    nextContext,
  );
```

> 你可以在[这里](https://github.com/facebook/react/blob/1fb18e22ae66fdb1dc127347e169e73948778e5a/packages/react-reconciler/src/ReactFiberClassComponent.old.js#L1137)看到这段代码

- checkHasForceUpdateAfterProcessing：内部会判断本次更新的`Update`是否为`ForceUpdate`。即如果本次更新的`Update`中存在`tag`为`ForceUpdate`，则返回`true`。

- checkShouldComponentUpdate：内部会调用`shouldComponentUpdate`方法。以及当该`ClassComponent`为`PureComponent`时会浅比较`state`与`props`。

> 你可以在[这里](https://github.com/facebook/react/blob/1fb18e22ae66fdb1dc127347e169e73948778e5a/packages/react-reconciler/src/ReactFiberClassComponent.old.js#L294)看到`checkShouldComponentUpdate`代码

所以，当某次更新含有`tag`为`ForceUpdate`的`Update`，那么当前`ClassComponent`不会受其他`性能优化手段`（`shouldComponentUpdate`|`PureComponent`）影响，一定会更新。

## 总结

至此，我们学习完了`HostRoot | ClassComponent`所使用的`Update`的更新流程。

在下一章我们会学习另一种数据结构的`Update` —— 用于`Hooks`的`Update`。