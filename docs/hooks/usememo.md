在了解其他`hook`的实现后，理解`useMemo`与`useCallback`的实现非常容易。

本节我们以`mount`与`update`两种情况分别讨论这两个`hook`。

## mount

```js
function mountMemo<T>(
  nextCreate: () => T,
  deps: Array<mixed> | void | null,
): T {
  // 创建并返回当前hook
  const hook = mountWorkInProgressHook();
  const nextDeps = deps === undefined ? null : deps;
  // 计算value
  const nextValue = nextCreate();
  // 将value与deps保存在hook.memoizedState
  hook.memoizedState = [nextValue, nextDeps];
  return nextValue;
}

function mountCallback<T>(callback: T, deps: Array<mixed> | void | null): T {
  // 创建并返回当前hook
  const hook = mountWorkInProgressHook();
  const nextDeps = deps === undefined ? null : deps;
  // 将value与deps保存在hook.memoizedState
  hook.memoizedState = [callback, nextDeps];
  return callback;
}
```

可以看到，与`mountCallback`这两个唯一的区别是

- `mountMemo`会将`回调函数`(nextCreate)的执行结果作为`value`保存

- `mountCallback`会将`回调函数`作为`value`保存

## update

```js
function updateMemo<T>(
  nextCreate: () => T,
  deps: Array<mixed> | void | null,
): T {
  // 返回当前hook
  const hook = updateWorkInProgressHook();
  const nextDeps = deps === undefined ? null : deps;
  const prevState = hook.memoizedState;

  if (prevState !== null) {
    if (nextDeps !== null) {
      const prevDeps: Array<mixed> | null = prevState[1];
      // 判断update前后value是否变化
      if (areHookInputsEqual(nextDeps, prevDeps)) {
        // 未变化
        return prevState[0];
      }
    }
  }
  // 变化，重新计算value
  const nextValue = nextCreate();
  hook.memoizedState = [nextValue, nextDeps];
  return nextValue;
}

function updateCallback<T>(callback: T, deps: Array<mixed> | void | null): T {
  // 返回当前hook
  const hook = updateWorkInProgressHook();
  const nextDeps = deps === undefined ? null : deps;
  const prevState = hook.memoizedState;

  if (prevState !== null) {
    if (nextDeps !== null) {
      const prevDeps: Array<mixed> | null = prevState[1];
      // 判断update前后value是否变化
      if (areHookInputsEqual(nextDeps, prevDeps)) {
        // 未变化
        return prevState[0];
      }
    }
  }

  // 变化，将新的callback作为value
  hook.memoizedState = [callback, nextDeps];
  return callback;
}
```

可见，对于`update`，这两个`hook`的唯一区别也是**是回调函数本身还是回调函数的执行结果作为value**。
