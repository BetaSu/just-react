为了更好理解`Hooks`原理，这一节我们遵循`React`的运行流程，实现一个不到100行代码的极简`useState Hook`。建议对照着代码来看本节内容。

## 工作原理

对于`useState Hook`，考虑如下例子：

```js
function App() {
  const [num, updateNum] = useState(0);

  return <p onClick={() => updateNum(num => num + 1)}>{num}</p>;
}
```

可以将工作分为两部分：

1. 通过一些途径产生`更新`，`更新`会造成组件`render`。

2. 组件`render`时`useState`返回的`num`为更新后的结果。

其中`步骤1`的`更新`可以分为`mount`和`update`：

1. 调用`ReactDOM.render`会产生`mount`的`更新`，`更新`内容为`useState`的`initialValue`（即`0`）。

2. 点击`p`标签触发`updateNum`会产生一次`update`的`更新`，`更新`内容为`num => num + 1`。

接下来讲解这两个步骤如何实现。

## 更新是什么

> 1. 通过一些途径产生`更新`，`更新`会造成组件`render`。

首先我们要明确`更新`是什么。

在我们的极简例子中，`更新`就是如下数据结构：

```js
const update = {
  // 更新执行的函数
  action,
  // 与同一个Hook的其他更新形成链表
  next: null
}
```

对于`App`来说，点击`p`标签产生的`update`的`action`为`num => num + 1`。

如果我们改写下`App`的`onClick`：

```js
// 之前
return <p onClick={() => updateNum(num => num + 1)}>{num}</p>;

// 之后
return <p onClick={() => {
  updateNum(num => num + 1);
  updateNum(num => num + 1);
  updateNum(num => num + 1);
}}>{num}</p>;
```

那么点击`p`标签会产生三个`update`。

## update数据结构

这些`update`是如何组合在一起呢？

答案是：他们会形成`环状单向链表`。

调用`updateNum`实际调用的是`dispatchAction.bind(null, hook.queue)`，我们先来了解下这个函数：

```js
function dispatchAction(queue, action) {
  // 创建update
  const update = {
    action,
    next: null
  }

  // 环状单向链表操作
  if (queue.pending === null) {
    update.next = update;
  } else {
    update.next = queue.pending.next;
    queue.pending.next = update;
  }
  queue.pending = update;

  // 模拟React开始调度更新
  schedule();
}
```

环状链表操作不太容易理解，这里我们详细讲解下。

当产生第一个`update`（我们叫他`u0`），此时`queue.pending === null`。

`update.next = update;`即`u0.next = u0`，他会和自己首尾相连形成`单向环状链表`。

然后`queue.pending = update;`即`queue.pending = u0`

```js
queue.pending = u0 ---> u0
                ^       |
                |       |
                ---------
```

当产生第二个`update`（我们叫他`u1`），`update.next = queue.pending.next;`，此时`queue.pending.next === u0`，
即`u1.next = u0`。

`queue.pending.next = update;`，即`u0.next = u1`。

然后`queue.pending = update;`即`queue.pending = u1`

```js
queue.pending = u1 ---> u0   
                ^       |
                |       |
                ---------
```

你可以照着这个例子模拟插入多个`update`的情况，会发现`queue.pending`始终指向最后一个插入的`update`。

这样做的好处是，当我们要遍历`update`时，`queue.pending.next`指向第一个插入的`update`。

## 状态如何保存

现在我们知道，`更新`产生的`update`对象会保存在`queue`中。

不同于`ClassComponent`的实例可以存储数据，对于`FunctionComponent`，`queue`存储在哪里呢？

答案是：`FunctionComponent`对应的`fiber`中。

我们使用如下精简的`fiber`结构：

```js
// App组件对应的fiber对象
const fiber = {
  // 保存该FunctionComponent对应的Hooks链表
  memoizedState: null,
  // 指向App函数
  stateNode: App
};
```

## Hook数据结构

接下来我们关注`fiber.memoizedState`中保存的`Hook`的数据结构。

可以看到，`Hook`与`update`类似，都通过`链表`连接。不过`Hook`是`无环`的`单向链表`。

```js
hook = {
  // 保存update的queue，即上文介绍的queue
  queue: {
    pending: null
  },
  // 保存hook对应的state
  memoizedState: initialState,
  // 与下一个Hook连接形成单向无环链表
  next: null
}
```

::: warning 注意
注意区分`update`与`hook`的所属关系：

每个`useState`对应一个`hook`对象。

调用`const [num, updateNum] = useState(0);`时`updateNum`（即上文介绍的`dispatchAction`）产生的`update`保存在`useState`对应的`hook.queue`中。

:::

## 模拟React调度更新流程

在上文`dispatchAction`末尾我们通过`schedule`方法模拟`React`调度更新流程。

```js
function dispatchAction(queue, action) {
  // ...创建update
  
  // ...环状单向链表操作

  // 模拟React开始调度更新
  schedule();
}
```

现在我们来实现他。

我们用`isMount`变量指代是`mount`还是`update`。

```js
// 首次render时是mount
isMount = true;

function schedule() {
  // 更新前将workInProgressHook重置为fiber保存的第一个Hook
  workInProgressHook = fiber.memoizedState;
  // 触发组件render
  fiber.stateNode();
  // 组件首次render为mount，以后再触发的更新为update
  isMount = false;
}
```

通过`workInProgressHook`变量指向当前正在工作的`hook`。

```js
workInProgressHook = fiber.memoizedState;
```

在组件`render`时，每当遇到下一个`useState`，我们移动`workInProgressHook`的指针。

```js
workInProgressHook = workInProgressHook.next;
```

这样，只要每次组件`render`时`useState`的调用顺序及数量保持一致，那么始终可以通过`workInProgressHook`找到当前`useState`对应的`hook`对象。


到此为止，我们已经完成第一步。

> 1. 通过一些途径产生`更新`，`更新`会造成组件`render`。

接下来实现第二步。

> 2. 组件`render`时`useState`返回的`num`为更新后的结果。

## 计算state

组件`render`时会调用`useState`，他的大体逻辑如下：

```js
function useState(initialState) {
  // 当前useState使用的hook会被赋值该该变量
  let hook;

  if (isMount) {
    // ...mount时需要生成hook对象
  } else {
    // ...update时从workInProgressHook中取出该useState对应的hook
  }

  let baseState = hook.memoizedState;
  if (hook.queue.pending) {
    // ...根据queue.pending中保存的update更新state
  }
  hook.memoizedState = baseState;

  return [baseState, dispatchAction.bind(null, hook.queue)];
}
```

我们首先关注如何获取`hook`对象：

```js
if (isMount) {
  // mount时为该useState生成hook
  hook = {
    queue: {
      pending: null
    },
    memoizedState: initialState,
    next: null
  }

  // 将hook插入fiber.memoizedState链表末尾
  if (!fiber.memoizedState) {
    fiber.memoizedState = hook;
  } else {
    workInProgressHook.next = hook;
  }
  // 移动workInProgressHook指针
  workInProgressHook = hook;
} else {
  // update时找到对应hook
  hook = workInProgressHook;
  // 移动workInProgressHook指针
  workInProgressHook = workInProgressHook.next;
}

```

当找到该`useState`对应的`hook`后，如果该`hook.queue.pending`不为空（即存在`update`），则更新其`state`。

```js
// update执行前的初始state
let baseState = hook.memoizedState;

if (hook.queue.pending) {
  // 获取update环状单向链表中第一个update
  let firstUpdate = hook.queue.pending.next;

  do {
    // 执行update action
    const action = firstUpdate.action;
    baseState = action(baseState);
    firstUpdate = firstUpdate.next;

    // 最后一个update执行完后跳出循环
  } while (firstUpdate !== hook.queue.pending.next)

  // 清空queue.pending
  hook.queue.pending = null;
}

// 将update action执行完后的state作为memoizedState
hook.memoizedState = baseState;
```

完整代码如下：

```js
function useState(initialState) {
  let hook;

  if (isMount) {
    hook = {
      queue: {
        pending: null
      },
      memoizedState: initialState,
      next: null
    }
    if (!fiber.memoizedState) {
      fiber.memoizedState = hook;
    } else {
      workInProgressHook.next = hook;
    }
    workInProgressHook = hook;
  } else {
    hook = workInProgressHook;
    workInProgressHook = workInProgressHook.next;
  }

  let baseState = hook.memoizedState;
  if (hook.queue.pending) {
    let firstUpdate = hook.queue.pending.next;

    do {
      const action = firstUpdate.action;
      baseState = action(baseState);
      firstUpdate = firstUpdate.next;
    } while (firstUpdate !== hook.queue.pending)

    hook.queue.pending = null;
  }
  hook.memoizedState = baseState;

  return [baseState, dispatchAction.bind(null, hook.queue)];
}
```

## 对触发事件进行抽象

最后，让我们抽象一下`React`的事件触发方式。

通过调用`App`返回的`click`方法模拟组件`click`的行为。

```js
function App() {
  const [num, updateNum] = useState(0);

  console.log(`${isMount ? 'mount' : 'update'} num: `, num);

  return {
    click() {
      updateNum(num => num + 1);
    }
  }
}
```

## 在线Demo

至此，我们完成了一个不到100行代码的`Hooks`。重要的是，他与`React`的运行逻辑相同。

::: details 精简Hooks的在线Demo

调用`window.app.click()`模拟组件点击事件。

你也可以使用多个`useState`。

```js
function App() {
  const [num, updateNum] = useState(0);
  const [num1, updateNum1] = useState(100);

  console.log(`${isMount ? 'mount' : 'update'} num: `, num);
  console.log(`${isMount ? 'mount' : 'update'} num1: `, num1);

  return {
    click() {
      updateNum(num => num + 1);
    },
    focus() {
      updateNum1(num => num + 3);
    }
  }
}
```

[关注公众号](../me.html)，后台回复**616**获得在线Demo地址

:::

## 与React的区别

我们用尽可能少的代码模拟了`Hooks`的运行，但是相比`React Hooks`，他还有很多不足。以下是他与`React Hooks`的区别：

1. `React Hooks`没有使用`isMount`变量，而是在不同时机使用不同的`dispatcher`。换言之，`mount`时的`useState`与`update`时的`useState`不是同一个函数。

2. `React Hooks`有中途跳过`更新`的优化手段。

3. `React Hooks`有`batchedUpdates`，当在`click`中触发三次`updateNum`，`精简React`会触发三次更新，而`React`只会触发一次。

4. `React Hooks`的`update`有`优先级`概念，可以跳过不高优先的`update`。

更多的细节，我们会在本章后续小节讲解。