上一节我们知道组件执行`beginWork`后会创建子`Fiber`节点，节点上可能存在`effectTag`。在[流程概览](/process/reconciler)我们知道组件在`render阶段`会经历`beginWork`与`completeWork`。

这一节让我们看看`completeWork`会做什么工作。

你可以从[这里](https://github.com/facebook/react/blob/master/packages/react-reconciler/src/ReactFiberCompleteWork.new.js#L652)看到`completeWork`方法定义。

## 流程概览

类似`beginWork`，`completeWork`也是针对不同`fiber.tag`调用不同的处理逻辑。

```js
function completeWork(
  current: Fiber | null,
  workInProgress: Fiber,
  renderLanes: Lanes,
): Fiber | null {
  const newProps = workInProgress.pendingProps;

  switch (workInProgress.tag) {
    case IndeterminateComponent:
    case LazyComponent:
    case SimpleMemoComponent:
    case FunctionComponent:
    case ForwardRef:
    case Fragment:
    case Mode:
    case Profiler:
    case ContextConsumer:
    case MemoComponent:
      return null;
    case ClassComponent: {
      // ...省略
      return null;
    }
    case HostRoot: {
      // ...省略
      updateHostContainer(workInProgress);
      return null;
    }
    case HostComponent: {
      // ...省略
      return null;
    }
  // ...省略
```

我们重点关注页面渲染所必须的`HostComponent`（即原生`DOM`组件对应的`Fiber`节点），其他类型`Fiber`的处理留在具体功能实现时讲解。

## 处理HostComponent

和`beginWork`一样，我们根据`current === null ?`判断是`mount`还是`update`。

同时针对`HostComponent`，判断`update`时我们还需要考虑`workInProgress.stateNode != null ?`（即该`Fiber`是否存在对应的`DOM`节点）

```js
case HostComponent: {
  popHostContext(workInProgress);
  const rootContainerInstance = getRootHostContainer();
  const type = workInProgress.type;

  if (current !== null && workInProgress.stateNode != null) {
    // update的情况
    // ...省略
  } else {
    // mount的情况
    // ...省略
  }
  return null;
}
```

## update时

当`update`时，`Fiber`节点已经存在对应`DOM`节点，所以不需要生成`DOM`节点。需要做的主要是处理`props`，比如：

- `onClick`、`onChange`等回调函数的注册
- 处理`style prop`
- 处理`DANGEROUSLY_SET_INNER_HTML prop`
- 处理`children prop`

我们去掉一些当前不需要关注的功能（比如`ref`）。可以看到最主要的逻辑是调用`updateHostComponent`方法。

```js
if (current !== null && workInProgress.stateNode != null) {
  // update的情况
  updateHostComponent(
    current,
    workInProgress,
    type,
    newProps,
    rootContainerInstance,
  );
}
```

你可以从[这里](https://github.com/facebook/react/blob/master/packages/react-reconciler/src/ReactFiberCompleteWork.new.js#L204)看到`updateHostComponent`方法定义。

在`updateHostComponent`内部，被处理完的`props`会被赋值给`workInProgress.updateQueue`，最终会在`commit阶段`中被渲染在页面上。

```ts
workInProgress.updateQueue = (updatePayload: any);
```

其中`updatePayload`为数组形式，他的奇数索引的值为变化的`prop key`，偶数索引的值为变化的`prop value`。

::: details updatePayload属性 Demo

我在`updateHostComponent`内打印`Fiber`节点对应的`type`与`updatePayload`。

你可以直观的感受`updatePayload`的数据结构

[Demo](https://code.h5jun.com/peron/edit?js,console,output)
:::

## mount时

同样，我们省略了不相关的逻辑。可以看到，`mount`时的主要逻辑包括三个：

- 为`Fiber`节点生成对应的`DOM`节点
- 将子孙`DOM`节点插入刚生成的`DOM`节点中
- 与`update`逻辑中的`updateHostComponent`类似的处理`props`的过程

```js
// mount的情况

// ...省略服务端渲染相关逻辑

const currentHostContext = getHostContext();
// 为fiber创建对应DOM节点
const instance = createInstance(
    type,
    newProps,
    rootContainerInstance,
    currentHostContext,
    workInProgress,
  );
// 将子孙DOM节点插入刚生成的DOM节点中
appendAllChildren(instance, workInProgress, false, false);
// DOM节点赋值给fiber.stateNode
workInProgress.stateNode = instance;

// 与update逻辑中的updateHostComponent类似的处理props的过程
if (
  finalizeInitialChildren(
    instance,
    type,
    newProps,
    rootContainerInstance,
    currentHostContext,
  )
) {
  markUpdate(workInProgress);
}
```

还记得[上一节](./beginWork.html#effecttag)我们说到：`mount`时只会在根`Fiber`节点存在`Placement effectTag`。那么`commit阶段`是如何通过一次插入`DOM`操作（对应一个`Placement effectTag`）将整棵`DOM`树插入页面的呢？

原因就在于`completeWork`中的`appendAllChildren`方法。

由于`completeWork`属于“归”阶段调用的函数，每次调用`appendAllChildren`时都会将已生成的子孙`DOM`节点插入当前生成的`DOM`节点下。那么当“归”到根`Fiber`节点时，我们已经有一个构建好的离屏`DOM`树。

## effectList

至此`render阶段`的绝大部分工作就完成了。还有一个问题：作为`DOM`操作的依据，`commit阶段`需要找到所有有`effectTag`的`Fiber`节点。如果在`commit阶段`再遍历一次`Fiber`树显然是很低效的。

为了解决这个问题，在`completeWork`的上层函数`completeUnitOfWork`中，每个执行完`completeWork`且存在`effectTag`的`Fiber`节点会被保存在一条被称为`effectList`的单向链表中。

`effectList`中第一个`Fiber`节点保存在`fiber.firstEffect`，最后一个元素保存在`fiber.lastEffect`。

类似`appendAllChildren`，在“归”阶段，所有有`effectTag`的`Fiber`节点都会被追加在`effectList`中，最终形成一条以`fiberRootNode.firstEffect`为起点的单向链表。

```js
                           nextEffect         nextEffect
fiberRootNode.firstEffect -----------> fiber -----------> fiber
```

你可以在[这里](https://github.com/facebook/react/blob/master/packages/react-reconciler/src/ReactFiberWorkLoop.new.js#L1605)看到这段代码逻辑。

借用`React`团队成员**Dan Abramov**的话：`effectList`相较于`Fiber`树，就像圣诞树上挂的那一串彩灯。

## 流程结尾

至此，`render阶段`全部工作完成。在`performSyncWorkOnRoot`函数中根`Fiber`节点被传递给`commitRoot`方法，开启`commit阶段`工作流程。

```js
commitRoot(root);
```

代码见[这里](https://github.com/facebook/react/blob/master/packages/react-reconciler/src/ReactFiberWorkLoop.new.js#L1020)。