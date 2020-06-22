上一章我们学习了`Reconciler`的工作流程，接下来就是`Renderer`的工作了。在本章正式开始前，我想先介绍几个源码内的术语：

- `Reconciler`工作的阶段被称为`render`阶段。因为在`beginWork`中会调用组件的`render`方法，根据方法返回值（即`JSX`对象）生成`Fiber`节点。
- `Renderer`工作的阶段被称为`commit`阶段。就像你完成一个需求的编码后执行`git commit`提交代码。`commit`阶段会把`render`阶段提交的信息渲染在页面上。
- `render`与`commit`阶段统称为`work`，即`React`在工作中。相对应的，如果任务正在`Scheduler`内调度，就不属于`work`。

## 概览

上一章[最后一节](../process/completeWork.html#流程结尾)我们介绍了，`commitRoot`方法是`Renderer`工作的起点。`rootFiberNode`会作为传参。

```js
commitRoot(root);
```

在`rootFiber.firstEffect`上保存了需要执行副作用的`Fiber`节点，这些`Fiber`节点的`updateQueue`中保存了变化的`props`。这些都需要在`commit`阶段被渲染在页面上。

除此之外，还有些生命周期钩子（比如`componentDidXXX`）、`hook`（比如`useEffect`）需要执行。

所以整个`commit`阶段（即`Renderer`的工作流程）分为三部分：

- 执行`DOM`操作前

- 执行`DOM`操作

- 执行`DOM`操作后


##