通过本章的学习，我们了解了`React`的`Scheduler-Reconciler-Renderer`架构体系，在结束本章前，我想介绍几个源码内的术语：

- `Reconciler`工作的阶段被称为`render`阶段。因为在该阶段会调用组件的`render`方法。
- `Renderer`工作的阶段被称为`commit`阶段。就像你完成一个需求的编码后执行`git commit`提交代码。`commit`阶段会把`render`阶段提交的信息渲染在页面上。
- `render`与`commit`阶段统称为`work`，即`React`在工作中。相对应的，如果任务正在`Scheduler`内调度，就不属于`work`。

在接下来的两章我们会分别讲解`Reconciler`和`Renderer`的工作流程，所以章节名分别为`render阶段`和`commit阶段`。