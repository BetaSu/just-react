在[前一章讲解React16的新架构](/preparation/newConstructure)时，我们提到的**虚拟DOM**在`React`中有个正式的称呼——Fiber。在之后的学习中，我们会逐渐用`Fiber`来取代**React16虚拟DOM**这一称呼。

接下来让我们了解下`Fiber`因何而来？他的作用是什么？

## Fiber的起源

> 最早的`Fiber`官方解释来源于[2016年React团队成员Acdlite的一篇介绍](https://github.com/acdlite/react-fiber-architecture)。

从上一章的学习我们知道：

在`React15`及以前，`Reconciler`采用递归的方式创建虚拟DOM，递归过程是不能中断的。如果组件树的层级很深，递归会占用线程很多时间，造成卡顿。

为了解决这个问题，`React16`将**递归的无法中断的更新**重构为**异步的可中断更新**，由于曾经用于递归的**虚拟DOM**数据结构已经无法满足需要。于是，全新的`Fiber`架构应运而生。

## Fiber的含义

`Fiber`包含三层含义：

1. 作为架构来说，之前`React15`的`Reconciler`采用递归的方式执行，数据保存在递归调用栈中，所以被称为`stack Reconciler`。`React16`的`Reconciler`基于`Fiber`节点实现，被称为`Fiber Reconciler`。

2. 作为静态的数据结构来说，每个`Fiber`节点对应一个组件，保存了该组件的类型（函数组件/类组件/原生组件...）、对应的DOM节点等信息。

3. 作为动态的工作单元来说，每个`Fiber`节点保存了本次更新中该组件改变的状态、要执行的工作（需要被删除/被插入页面中/被更新...）。

## Fiber的结构

你可以从这里看到[Fiber节点的属性定义](https://github.com/facebook/react/blob/master/packages/react-reconciler/src/ReactFiber.new.js#L116)。虽然属性很多，但我们可以按三层含义将他们分类来看

```js
function FiberNode(
  tag: WorkTag,
  pendingProps: mixed,
  key: null | string,
  mode: TypeOfMode,
) {
  // 作为静态数据结构的属性
  this.tag = tag;
  this.key = key;
  this.elementType = null;
  this.type = null;
  this.stateNode = null;

  // 用于连接其他Fiber节点形成Fiber树
  this.return = null;
  this.child = null;
  this.sibling = null;
  this.index = 0;

  this.ref = null;

  // 作为动态的工作单元的属性
  this.pendingProps = pendingProps;
  this.memoizedProps = null;
  this.updateQueue = null;
  this.memoizedState = null;
  this.dependencies = null;

  this.mode = mode;

  this.effectTag = NoEffect;
  this.nextEffect = null;

  this.firstEffect = null;
  this.lastEffect = null;

  this.lanes = NoLanes;
  this.childLanes = NoLanes;

  this.alternate = null;
}
```

### 作为架构来说

每个`Fiber`节点对应一个组件，多个`Fiber`节点是如何连接形成树呢？靠如下三个属性：

```js
// 指向父级Fiber节点
this.return = null;
// 指向子Fiber节点
this.child = null;
// 指向右边第一个兄弟Fiber节点
this.sibling = null;
```

举个例子，如下的组件结构：

```js
function App() {
  return (
    <div>
      i am
      <span>KaSong</span>
    </div>
  )
}
```

对应的`Fiber`树结构：
<img :src="$withBase('/img/fiber.png')" alt="Fiber架构">

> 这里需要提一下，为什么父级指针叫做`return`而不是`parent`或者`father`呢？因为作为一个工作单元，`return`指节点完成工作后会返回的下一个节点，子`Fiber`节点完成工作后会返回其父级节点

### 作为静态的数据结构

作为一种静态的数据结构，保存了组件相关的信息：

```js
// Fiber对应组件的类型 Function/Class/Host...
this.tag = tag;
// key属性
this.key = key;
// 类似type
this.elementType = null;
// 对于 FunctionComponent，指函数本身，对于ClassCompoent，指class，对于HostComponent，指DOM节点tagName
this.type = null;
// Fiber对应的真实DOM节点
this.stateNode = null;
```

### 作为动态的工作单元

作为动态的工作单元，`Fiber`中如下参数保存了本次更新相关的信息，我们会在后续的更新流程中使用到具体属性时再详细介绍
```js

// 保存本次更新造成的状态改变相关信息
this.pendingProps = pendingProps;
this.memoizedProps = null;
this.updateQueue = null;
this.memoizedState = null;
this.dependencies = null;

this.mode = mode;

// 保存本次更新会造成的DOM操作
this.effectTag = NoEffect;
this.nextEffect = null;

this.firstEffect = null;
this.lastEffect = null;
```

## 参考资料

[Lin Clark - A Cartoon Intro to Fiber - React Conf 2017](https://www.bilibili.com/video/BV1it411p7v6?from=search&seid=3508901752524570226)