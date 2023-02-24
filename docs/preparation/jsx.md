`JSX`作为描述组件内容的数据结构，为JS赋予了更多视觉表现力。在`React`中我们大量使用他。在深入源码之前，有些疑问我们需要先解决：

- `JSX`和`Fiber节点`是同一个东西么？
- `React Component`、`React Element`是同一个东西么，他们和`JSX`有什么关系？

带着这些疑问，让我们开始这一节的学习。

## JSX简介
相信作为`React`的使用者，你已经接触过`JSX`。如果你还不了解他，可以看下[官网对其的描述](https://react.docschina.org/docs/introducing-jsx.html)。

`JSX`在编译时会被`Babel`编译为`React.createElement`方法。

::: details JSX编译 

[关注公众号](../me.html)，后台回复**712**获得在线Demo地址
:::

这也是为什么在每个使用`JSX`的JS文件中，你必须显式的声明
```js
import React from 'react';
```
否则在运行时该模块内就会报`未定义变量 React`的错误。

::: warning 注意 

从 React16.14.0 开始，已经不需要显式导入React了。详见[介绍全新的 JSX 转换](https://zh-hans.reactjs.org/blog/2020/09/22/introducing-the-new-jsx-transform.html)
:::

`JSX`并不是只能被编译为`React.createElement`方法，你可以通过[@babel/plugin-transform-react-jsx](https://babeljs.io/docs/en/babel-plugin-transform-react-jsx)插件显式告诉`Babel`编译时需要将`JSX`编译为什么函数的调用（默认为`React.createElement`）。

比如在[preact](https://github.com/preactjs/preact)这个类`React`库中，`JSX`会被编译为一个名为`h`的函数调用。
```jsx
// 编译前
<p>KaSong</p>
// 编译后
h("p", null, "KaSong");
```

## [React.createElement](https://github.com/facebook/react/blob/1fb18e22ae66fdb1dc127347e169e73948778e5a/packages/react/src/ReactElement.js#L348)

既然`JSX`会被编译为`React.createElement`，让我们看看他做了什么：

```js
export function createElement(type, config, children) {
  let propName;

  const props = {};

  let key = null;
  let ref = null;
  let self = null;
  let source = null;

  if (config != null) {
    // 将 config 处理后赋值给 props
    // ...省略
  }

  const childrenLength = arguments.length - 2;
  // 处理 children，会被赋值给props.children
  // ...省略

  // 处理 defaultProps
  // ...省略

  return ReactElement(
    type,
    key,
    ref,
    self,
    source,
    ReactCurrentOwner.current,
    props,
  );
}

const ReactElement = function(type, key, ref, self, source, owner, props) {
  const element = {
    // 标记这是个 React Element
    $$typeof: REACT_ELEMENT_TYPE,

    type: type,
    key: key,
    ref: ref,
    props: props,
    _owner: owner,
  };

  return element;
};
```

我们可以看到，`React.createElement`最终会调用`ReactElement`方法返回一个包含组件数据的对象，该对象有个参数`$$typeof: REACT_ELEMENT_TYPE`标记了该对象是个`React Element`。

所以调用`React.createElement`返回的对象就是`React Element`么？

`React`提供了验证合法`React Element`的全局API [React.isValidElement](https://github.com/facebook/react/blob/1fb18e22ae66fdb1dc127347e169e73948778e5a/packages/react/src/ReactElement.js#L547)，我们看下他的实现：

```js
export function isValidElement(object) {
  return (
    typeof object === 'object' &&
    object !== null &&
    object.$$typeof === REACT_ELEMENT_TYPE
  );
}
```

可以看到，`$$typeof === REACT_ELEMENT_TYPE`的非`null`对象就是一个合法的`React Element`。换言之，在`React`中，所有`JSX`在运行时的返回结果（即`React.createElement()`的返回值）都是`React Element`。

那么`JSX`和`React Component`的关系呢?

## React Component

在`React`中，我们常使用`ClassComponent`与`FunctionComponent`构建组件。

```jsx
class AppClass extends React.Component {
  render() {
    return <p>KaSong</p>
  }
}
console.log('这是ClassComponent：', AppClass);
console.log('这是Element：', <AppClass/>);


function AppFunc() {
  return <p>KaSong</p>;
}
console.log('这是FunctionComponent：', AppFunc);
console.log('这是Element：', <AppFunc/>);
```

::: details React Component 分类 Demo
[关注公众号](../me.html)，后台回复**901**获得在线Demo地址
:::

我们可以从Demo控制台打印的对象看出，`ClassComponent`对应的`Element`的`type`字段为`AppClass`自身。

`FunctionComponent`对应的`Element`的`type`字段为`AppFunc`自身，如下所示：

```js
{
  $$typeof: Symbol(react.element),
  key: null,
  props: {},
  ref: null,
  type: ƒ AppFunc(),
  _owner: null,
  _store: {validated: false},
  _self: null,
  _source: null 
}
```

值得注意的一点，由于

```js
AppClass instanceof Function === true;
AppFunc instanceof Function === true;
```

所以无法通过引用类型区分`ClassComponent`和`FunctionComponent`。`React`通过`ClassComponent`实例原型上的`isReactComponent`变量判断是否是`ClassComponent`。

```js
ClassComponent.prototype.isReactComponent = {};
```

## JSX与Fiber节点

从上面的内容我们可以发现，`JSX`是一种描述当前组件内容的数据结构，他不包含组件**schedule**、**reconcile**、**render**所需的相关信息。

比如如下信息就不包括在`JSX`中：

- 组件在更新中的`优先级`
- 组件的`state`
- 组件被打上的用于**Renderer**的`标记`

这些内容都包含在`Fiber节点`中。

所以，在组件`mount`时，`Reconciler`根据`JSX`描述的组件内容生成组件对应的`Fiber节点`。

在`update`时，`Reconciler`将`JSX`与`Fiber节点`保存的数据对比，生成组件对应的`Fiber节点`，并根据对比结果为`Fiber节点`打上`标记`。

## 参考资料

- [如何干掉知乎的全部DIV -- 通过这篇文章在运行时修改`React.createElement`达到消除页面所有`div`元素的效果](https://mp.weixin.qq.com/s/ICjOlJL-fUGRb2S_xqBT7Q)

- [React官网Blog，关于React Component, Element, Instance, Reconciliation的简介](https://reactjs.org/blog/2015/12/18/react-components-elements-and-instances.html)
