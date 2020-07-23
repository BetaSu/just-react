::: warning 注意

在开始本章学习前，你需要了解`Hooks`的基本用法。

如果你还未使用过`Hooks`，可以从[官方文档](https://zh-hans.reactjs.org/docs/hooks-intro.html)开始。

:::

你可以从[这里](https://zh-hans.reactjs.org/docs/hooks-intro.html#motivation)了解`Hooks`的设计动机。作为一名`框架使用者`，了解`设计动机`对于我们日常开发就足够了。

但是，为了更好的理解`Hooks`的`源码架构`，我们需要转换身份，以`框架开发者`的角度来看待`Hooks`的`设计理念`。

## 从LOGO聊起

<img :src="$withBase('/img/logo.png')" alt="LOGO">

`React` `LOGO`的图案是代表`原子`（`atom`）的符号。世间万物由`原子`组成，`原子`的`类型`与`属性`决定了事物的外观与表现。

同样，在`React`中，我们可以将`UI`拆分为很多独立的单元，每个单元被称为`Component`。这些`Component`的`属性`与`类型`决定了`UI`的外观与表现。

讽刺的是，`原子`在希腊语中的意思为`不可分割的`（`indivisible`），但随后科学家在原子中发现了更小的粒子 —— 电子（`electron`）。电子可以很好的解释`原子`是如何工作的。

在`React`中，我们可以说`ClassComponent`是一类`原子`。

但对于`Hooks`来说，与其说是一类`原子`，不如说他是更贴近事物`运行规律`的`电子`。

我们知道，`React`的架构遵循`schedule - render - commit`的运行流程，这个流程是`React`世界最底层的`运行规律`。

`ClassComponent`作为`React`世界的`原子`，他的`生命周期`（`componentWillXXX`/`componentDidXXX`）是为了介入`React`的运行流程而实现的更上层抽象，这么做是为了方便`框架使用者`更容易上手。

相比于`ClassComponent`的更上层抽象，`Hooks`则更贴近`React`内部运行的各种概念（`state` | `context` | `life-cycle`）。

作为使用`React`技术栈的开发者，当我们初次学习`Hooks`时，不管是官方文档还是身边有经验的同事，总会拿`ClassComponent`的生命周期来类比`Hooks API`的执行时机。

这固然是很好的上手方式，但是当我们熟练运用`Hooks`时，就会发现，这两者的概念有很多割裂感，并不是同一抽象层次可以互相替代的概念。

比如：替代`componentWillReceiveProps`的`Hooks`是什么呢？

可能有些同学会回答，是`useEffect`：

```js
  useEffect( () => {
    console.log('something updated');
  }, [props.something])
```

但是`componentWillReceiveProps`是在`render阶段`执行，而`useEffect`是在`commit阶段`完成渲染后异步执行。

> 这篇文章可以帮你更好理解`componentWillReceiveProps`：[深入源码剖析componentWillXXX为什么UNSAFE](https://juejin.im/post/5f05a3e25188252e5c576cdb)

所以，从源码运行规律的角度看待`Hooks`，可能是更好的角度。这也是为什么上文说`Hooks`是`React`世界的`电子`而不是`原子`的原因。

> 以上见解参考自[React Core Team Dan在 React Conf2018的演讲](https://www.youtube.com/watch?v=dpw9EHDh2bM&feature=youtu.be)

<!-- ## Hooks设计动机

那么真的有`Hooks`能做而`ClassComponent`无法实现的`feature`么？

是的。

让我们再来看看`React`耗时三年重构完成的`Fiber结构`。在之前的章节我们讲过，这次重构的一大目的是**使更新可以异步执行并且可中断**。

现在让我们看看另一大目的：**使同一组件在同一时间可以拥有多个状态，即同一个组件可以拥有多条时间线**。

<img :src="$withBase('/img/hooks-mental.png')" alt="hooks设计理念">

> [React Core Team Sebastian谈Hooks设计动机](https://twitter.com/sebmarkbage/status/1084539728743956481)

`fiber`可以直译为`光纤`。

<img :src="$withBase('/img/lightfiber.jpg')" alt="fiber">

可以看到，一束`光纤`内部存在多束同时工作的玻璃芯。在`React`中，每条玻璃芯代表一个`Component`的时间线。

由于`ClassComponent`遵循`OOP`原则，`逻辑`和`状态`耦合在`实例`内部，无法在同一时间拥有多个`状态`（即同一时间只存在一个`this.state`）。

对于`Hooks`来说，`FunctionComponent`契合`FP`的编程思想（即`无状态`），更新组件时`Hooks`的`状态`保存在`闭包`中。换言之，同一`FunctionComponent`在同一时间可以拥有保存在不同`闭包`中的多个`状态`。

::: details 多条时间线 Demo

你可以使用[useDeferredValue](https://zh-hans.reactjs.org/docs/concurrent-mode-reference.html#usedeferredvalue)使同一组件的某个`状态`在同一时间拥有多条时间线。

不同时间线重合的时间视**用户设备的性能**不同而不同。

在Demo中，你可以从控制台看到不同`状态`的`值`与`更新时间`

[Demo](https://codesandbox.io/s/friendly-bush-hk5co)

::: -->

## 总结

`Concurrent Mode`是`React`未来的发展方向，而`Hooks`是能够最大限度发挥`Concurrent Mode`潜力的`Component`构建方式。

正如Dan在`React Conf 2018`演讲结尾所说：你可以从`React`的`LOGO`中看到这些围绕着`核心`的`电子飞行轨道`，`Hooks`可能一直就在其中。