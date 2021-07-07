`ref`是`reference`（引用）的缩写。在`React`中，我们习惯用`ref`保存`DOM`。

事实上，任何需要被"引用"的数据都可以保存在`ref`中，`useRef`的出现将这种思想进一步发扬光大。

在[Hooks数据结构一节](./structure.html#memoizedstate)我们讲到：

> 对于`useRef(1)`，`memoizedState`保存`{current: 1}`

本节我们会介绍`useRef`的实现，以及`ref`的工作流程。

由于`string`类型的`ref`已不推荐使用，所以本节针对`function | {current: any}`类型的`ref`。

## useRef

与其他`Hook`一样，对于`mount`与`update`，`useRef`对应两个不同`dispatcher`。

```js
function mountRef<T>(initialValue: T): {|current: T|} {
  // 获取当前useRef hook
  const hook = mountWorkInProgressHook();
  // 创建ref
  const ref = {current: initialValue};
  hook.memoizedState = ref;
  return ref;
}

function updateRef<T>(initialValue: T): {|current: T|} {
  // 获取当前useRef hook
  const hook = updateWorkInProgressHook();
  // 返回保存的数据
  return hook.memoizedState;
}
```

> 你可以在[这里](https://github.com/facebook/react/blob/1fb18e22ae66fdb1dc127347e169e73948778e5a/packages/react-reconciler/src/ReactFiberHooks.old.js#L1208-L1221)看到这段代码

可见，`useRef`仅仅是返回一个包含`current`属性的对象。

为了验证这个观点，我们再看下`React.createRef`方法的实现：

```js
export function createRef(): RefObject {
  const refObject = {
    current: null,
  };
  return refObject;
}
```

> 你可以从[这里](https://github.com/facebook/react/blob/1fb18e22ae66fdb1dc127347e169e73948778e5a/packages/react/src/ReactCreateRef.js)看到这段代码

了解了`ref`的数据结构后，我们再来看看`ref`的工作流程。

## ref的工作流程

在`React`中，`HostComponent`、`ClassComponent`、`ForwardRef`可以赋值`ref`属性。

```js
// HostComponent
<div ref={domRef}></div>
// ClassComponent / ForwardRef
<App ref={cpnRef} />
```

其中，`ForwardRef`只是将`ref`作为第二个参数传递下去，不会进入`ref`的工作流程。

所以接下来讨论`ref`的工作流程时会排除`ForwardRef`。

```js
// 对于ForwardRef，secondArg为传递下去的ref
let children = Component(props, secondArg);
```

> 你可以在[这里](https://github.com/facebook/react/blob/1fb18e22ae66fdb1dc127347e169e73948778e5a/packages/react-reconciler/src/ReactFiberHooks.old.js#L415)看到这段代码

我们知道`HostComponent`在`commit阶段`的`mutation阶段`执行`DOM`操作。

所以，对应`ref`的更新也是发生在`mutation阶段`。

再进一步，`mutation阶段`执行`DOM`操作的依据为`effectTag`。

所以，对于`HostComponent`、`ClassComponent`如果包含`ref`操作，那么也会赋值相应的`effectTag`。

```js
// ...
export const Placement = /*                    */ 0b0000000000000010;
export const Update = /*                       */ 0b0000000000000100;
export const Deletion = /*                     */ 0b0000000000001000;
export const Ref = /*                          */ 0b0000000010000000;
// ...
```

> 你可以在[ReactSideEffectTags文件](https://github.com/facebook/react/blob/1fb18e22ae66fdb1dc127347e169e73948778e5a/packages/react-reconciler/src/ReactSideEffectTags.js#L24)中看到`ref`对应的`effectTag`

所以，`ref`的工作流程可以分为两部分：

- `render阶段`为含有`ref`属性的`fiber`添加`Ref effectTag`

- `commit阶段`为包含`Ref effectTag`的`fiber`执行对应操作

## render阶段

在`render阶段`的`beginWork`与`completeWork`中有个同名方法`markRef`用于为含有`ref`属性的`fiber`增加`Ref effectTag`。

```js
// beginWork的markRef
function markRef(current: Fiber | null, workInProgress: Fiber) {
  const ref = workInProgress.ref;
  if (
    (current === null && ref !== null) ||
    (current !== null && current.ref !== ref)
  ) {
    // Schedule a Ref effect
    workInProgress.effectTag |= Ref;
  }
}
// completeWork的markRef
function markRef(workInProgress: Fiber) {
  workInProgress.effectTag |= Ref;
}
```

> 你可以在[这里](https://github.com/facebook/react/blob/1fb18e22ae66fdb1dc127347e169e73948778e5a/packages/react-reconciler/src/ReactFiberBeginWork.old.js#L693)看到`beginWork`的`markRef`、[这里](https://github.com/facebook/react/blob/1fb18e22ae66fdb1dc127347e169e73948778e5a/packages/react-reconciler/src/ReactFiberCompleteWork.old.js#L153)看到`completeWork`的`markRef`

在`beginWork`中，如下两处调用了`markRef`：

- `updateClassComponent`内的[finishClassComponent](https://github.com/facebook/react/blob/1fb18e22ae66fdb1dc127347e169e73948778e5a/packages/react-reconciler/src/ReactFiberBeginWork.old.js#L958)，对应`ClassComponent`

注意`ClassComponent`即使`shouldComponentUpdate`为`false`该组件也会调用`markRef`

- [updateHostComponent](https://github.com/facebook/react/blob/1fb18e22ae66fdb1dc127347e169e73948778e5a/packages/react-reconciler/src/ReactFiberBeginWork.old.js#L1156)，对应`HostComponent`

在`completeWork`中，如下两处调用了`markRef`：

- `completeWork`中的[HostComponent](https://github.com/facebook/react/blob/1fb18e22ae66fdb1dc127347e169e73948778e5a/packages/react-reconciler/src/ReactFiberCompleteWork.old.js#L728)类型

- `completeWork`中的[ScopeComponent](https://github.com/facebook/react/blob/1fb18e22ae66fdb1dc127347e169e73948778e5a/packages/react-reconciler/src/ReactFiberCompleteWork.old.js#L1278)类型

> `ScopeComponent`是一种用于管理`focus`的测试特性，详见[PR](https://github.com/facebook/react/pull/16587)

总结下`组件`对应`fiber`被赋值`Ref effectTag`需要满足的条件：

- `fiber`类型为`HostComponent`、`ClassComponent`、`ScopeComponent`（这种情况我们不讨论）

- 对于`mount`，`workInProgress.ref !== null`，即存在`ref`属性

- 对于`update`，`current.ref !== workInProgress.ref`，即`ref`属性改变



## commit阶段

在`commit阶段`的`mutation阶段`中，对于`ref`属性改变的情况，需要先移除之前的`ref`。

```js
function commitMutationEffects(root: FiberRoot, renderPriorityLevel) {
  while (nextEffect !== null) {

    const effectTag = nextEffect.effectTag;
    // ...

    if (effectTag & Ref) {
      const current = nextEffect.alternate;
      if (current !== null) {
        // 移除之前的ref
        commitDetachRef(current);
      }
    }
    // ...
  }
  // ...
```

> 你可以在[这里](https://github.com/facebook/react/blob/1fb18e22ae66fdb1dc127347e169e73948778e5a/packages/react-reconciler/src/ReactFiberWorkLoop.old.js#L2342)看到这段代码

```js
function commitDetachRef(current: Fiber) {
  const currentRef = current.ref;
  if (currentRef !== null) {
    if (typeof currentRef === 'function') {
      // function类型ref，调用他，传参为null
      currentRef(null);
    } else {
      // 对象类型ref，current赋值为null
      currentRef.current = null;
    }
  }
}
```

接下来，在`mutation阶段`，对于`Deletion effectTag`的`fiber`（对应需要删除的`DOM节点`），需要递归他的子树，对子孙`fiber`的`ref`执行类似`commitDetachRef`的操作。

在[mutation阶段一节](renderer/mutation.html#commitmutationeffects)我们讲到

> 对于`Deletion effectTag`的`fiber`，会执行`commitDeletion`。

在`commitDeletion`——`unmountHostComponents`——`commitUnmount`——`ClassComponent | HostComponent`类型`case`中调用的`safelyDetachRef`方法负责执行类似`commitDetachRef`的操作。

```js
function safelyDetachRef(current: Fiber) {
  const ref = current.ref;
  if (ref !== null) {
    if (typeof ref === 'function') {
      try {
        ref(null);
      } catch (refError) {
        captureCommitPhaseError(current, refError);
      }
    } else {
      ref.current = null;
    }
  }
}
```

> 你可以在[这里](https://github.com/facebook/react/blob/1fb18e22ae66fdb1dc127347e169e73948778e5a/packages/react-reconciler/src/ReactFiberCommitWork.old.js#L183)看到这段代码

接下来进入`ref`的赋值阶段。我们在[Layout阶段一节](../renderer/layout.html#commitlayouteffects)讲到

> `commitLayoutEffect`会执行`commitAttachRef`（赋值`ref`）

```js
function commitAttachRef(finishedWork: Fiber) {
  const ref = finishedWork.ref;
  if (ref !== null) {
    // 获取ref属性对应的Component实例
    const instance = finishedWork.stateNode;
    let instanceToUse;
    switch (finishedWork.tag) {
      case HostComponent:
        instanceToUse = getPublicInstance(instance);
        break;
      default:
        instanceToUse = instance;
    }

    // 赋值ref
    if (typeof ref === 'function') {
      ref(instanceToUse);
    } else {
      ref.current = instanceToUse;
    }
  }
}
```

至此，`ref`的工作流程完毕。

## 总结

本节我们学习了`ref`的工作流程。

- 对于`FunctionComponent`，`useRef`负责创建并返回对应的`ref`。

- 对于赋值了`ref`属性的`HostComponent`与`ClassComponent`，会在`render阶段`经历赋值`Ref effectTag`，在`commit阶段`执行对应`ref`操作。
