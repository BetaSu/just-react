在[ReactDOM.render](../state/reactdom.html#react%E7%9A%84%E5%85%B6%E4%BB%96%E5%85%A5%E5%8F%A3%E5%87%BD%E6%95%B0)一节我们介绍了`React`当前的三种入口函数。当前我们日常开发主要使用的是`Legacy Mode`（通过`ReactDOM.render`创建）。

在[React v17.0 正式发布！](https://mp.weixin.qq.com/s/zrrqldzRbcPApga_Cp2b8A)一文可以看到，`v17.0`没有包含新特性。究其原因，`v17.0`主要的工作在于源码内部对`Concurrent Mode`的支持。所以`v17`版本也被称为“垫脚石”版本。

`Concurrent Mode`是`React`过去2年重构`Fiber架构`的源动力，也是`React`未来的发展方向。

可以预见，当`v17`完美支持`Concurrent Mode`后，`v18`会迎来一大波基于`Concurrent Mode`的库。

## Concurrent Mode是什么

可以用一个公式表示`React`：

```js
view = React(state);
```

即`React`是状态（state）到视图（view）的映射。

再深入源码一点，映射过程包含如下几步：

1. 用户通过各种方式创建`Update`（比如点击事件回调、异步获取数据）

2. 基于`Update`计算`state`

3. 根据`state`，计算当前视图有哪些部分改变

4. `React`用渲染器（比如`ReactDOM`）对改变部分执行视图操作，视图更新

可以看到，

通过`Concurrent Mode`，框架可以实现







