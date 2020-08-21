在[架构篇commit阶段流程概览](../renderer/prepare.html)我们讲解了`useEffect`的工作流程。

其中我们谈到

> 在`flushPassiveEffects`方法内部会从全局变量`rootWithPendingPassiveEffects`获取`effectList`。

本节我们深入`flushPassiveEffects`方法内部探索`useEffect`的工作原理。

## flushPassiveEffectsImpl

`flushPassiveEffects`内部会设置`优先级`，并执行`flushPassiveEffectsImpl`。

> 你可以从[这里](https://github.com/facebook/react/blob/1fb18e22ae66fdb1dc127347e169e73948778e5a/packages/react-reconciler/src/ReactFiberWorkLoop.old.js#L2458)看到`flushPassiveEffects`的代码

`flushPassiveEffectsImpl`主要做三件事：

- 调用该`useEffect`在上一次`render`时的销毁函数

- 调用该`useEffect`在本次`render`时的回调函数

- 如果存在同步任务，不需要等待下次`事件循环`的`宏任务`，提前执行他

本节我们关注前两步。

在`v16`中第一步是同步执行的，在[官方博客](https://zh-hans.reactjs.org/blog/2020/08/10/react-v17-rc.html#effect-cleanup-timing)中提到：

> 副作用清理函数（如果存在）在 React 16 中同步运行。我们发现，对于大型应用程序来说，这不是理想选择，因为同步会减缓屏幕的过渡（例如，切换标签）。

基于这个原因，在`v17.0.0`中，`useEffect`的两个阶段会在页面渲染后（`layout`阶段后）异步执行。

> 事实上，从代码中看，`v16.13.1`中已经是异步执行了

接下来我们详细讲解这两个步骤。

## 阶段一：销毁函数的执行

`useEffect`的执行需要保证所有组件`useEffect`的`销毁函数`必须都执行完后才能执行任意一个组件的`useEffect`的`回调函数`。

这是因为多个`组件`间可能共用同一个`ref`。

如果不是按照“全部销毁”再“全部执行”的顺序，那么在某个组件`useEffect`的`销毁函数`中修改的`ref.current`可能影响另一个组件`useEffect`的`回调函数`中的同一个`ref`的`current`属性。

在`useLayoutEffect`中也有同样的问题，所以他们都遵循“全部销毁”再“全部执行”的顺序。

在阶段一，会遍历并执行所有`useEffect`的`销毁函数`。

```js
// pendingPassiveHookEffectsUnmount中保存了所有需要执行销毁的useEffect
const unmountEffects = pendingPassiveHookEffectsUnmount;
  pendingPassiveHookEffectsUnmount = [];
  for (let i = 0; i < unmountEffects.length; i += 2) {
    const effect = ((unmountEffects[i]: any): HookEffect);
    const fiber = ((unmountEffects[i + 1]: any): Fiber);
    const destroy = effect.destroy;
    effect.destroy = undefined;

    if (typeof destroy === 'function') {
      // 销毁函数存在则执行
      try {
        destroy();
      } catch (error) {
        captureCommitPhaseError(fiber, error);
      }
    }
  }
```

其中`pendingPassiveHookEffectsUnmount`数组的索引`i`保存需要销毁的`effect`，`i+1`保存该`effect`对应的`fiber`。

向`pendingPassiveHookEffectsUnmount`数组内`push`数据的操作发生在`layout阶段` `commitLayoutEffectOnFiber`方法内部的`schedulePassiveEffects`方法中。

> `commitLayoutEffectOnFiber`方法我们在[Layout阶段](../renderer/layout.html#commitlayouteffectonfiber)已经介绍

```js
function schedulePassiveEffects(finishedWork: Fiber) {
  const updateQueue: FunctionComponentUpdateQueue | null = (finishedWork.updateQueue: any);
  const lastEffect = updateQueue !== null ? updateQueue.lastEffect : null;
  if (lastEffect !== null) {
    const firstEffect = lastEffect.next;
    let effect = firstEffect;
    do {
      const {next, tag} = effect;
      if (
        (tag & HookPassive) !== NoHookEffect &&
        (tag & HookHasEffect) !== NoHookEffect
      ) {
        // 向`pendingPassiveHookEffectsUnmount`数组内`push`要销毁的effect
        enqueuePendingPassiveHookEffectUnmount(finishedWork, effect);
        // 向`pendingPassiveHookEffectsMount`数组内`push`要执行回调的effect
        enqueuePendingPassiveHookEffectMount(finishedWork, effect);
      }
      effect = next;
    } while (effect !== firstEffect);
  }
}
```

## 阶段二：回调函数的执行

与阶段一类似，同样遍历数组，执行对应`effect`的`回调函数`。

其中向`pendingPassiveHookEffectsMount`中`push`数据的操作同样发生在`schedulePassiveEffects`中。

```js
// pendingPassiveHookEffectsMount中保存了所有需要执行回调的useEffect
const mountEffects = pendingPassiveHookEffectsMount;
pendingPassiveHookEffectsMount = [];
for (let i = 0; i < mountEffects.length; i += 2) {
  const effect = ((mountEffects[i]: any): HookEffect);
  const fiber = ((mountEffects[i + 1]: any): Fiber);
  
  try {
    const create = effect.create;
   effect.destroy = create();
  } catch (error) {
    captureCommitPhaseError(fiber, error);
  }
}
```