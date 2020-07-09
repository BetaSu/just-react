在深入源码前，让我们先建立`更新机制`的`心智模型`。

在后面两节讲解源码时，我们会将代码与`心智模型`联系上，方便你更好理解。

## 同步更新的React

我们可以将`更新机制`类比`代码版本控制`。

在没有`代码版本控制`前，我们在代码中逐步叠加功能。一切看起来井然有序，直到我们遇到了一个紧急线上bug（红色节点）。

<img :src="$withBase('/img/git1.png')" alt="流程1">

为了修复这个bug，我们需要首先将之前的代码提交。

在`React`中，所有通过`ReactDOM.render`创建的应用（其他创建应用的方式参考[ReactDOM.render一节](./reactdom.html#react的其他入口函数)）都是通过类似的方式`更新状态`。

即没有`优先级`概念，`高优更新`（红色节点）需要排在其他`更新`后面执行。

## 并发更新的React

当有了`代码版本控制`，有紧急线上bug需要修复时，我们暂存当前分支的修改，在`master分支`修复bug并紧急上线。

<img :src="$withBase('/img/git2.png')" alt="流程2">

bug修复上线后通过`git rebase`命令和`开发分支`连接上。`开发分支`基于`修复bug的版本`继续开发。

<img :src="$withBase('/img/git3.png')" alt="流程3">

在`React`中，通过`ReactDOM.createBlockingRoot`和`ReactDOM.createRoot`创建的应用会采用`并发`的方式`更新状态`。

`高优更新`（红色节点）中断正在进行中的`低优更新`（蓝色节点），先完成`render - commit流程`。

待`高优更新`完成后，`低优更新`基于`高优更新`的结果`重新更新`。

接下来两节我们会从源码角度讲解这套`并发更新`是如何实现的。

## 参考资料

[`外网` `英文` React Core Team Dan介绍React未来发展方向](https://www.youtube.com/watch?v=v6iR3Zk4oDY)