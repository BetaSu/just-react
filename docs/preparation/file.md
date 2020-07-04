经过之前的学习，我们已经知道`React16`的架构分为三层：

- Scheduler（调度器）—— 调度任务的优先级，高优任务优先进入**Reconciler**
- Reconciler（协调器）—— 负责找出变化的组件
- Renderer（渲染器）—— 负责将变化的组件渲染到页面上

那么架构是如何体现在源码的文件结构上呢，让我们一起看看吧。

## 顶层目录

拉取代码到本地

```sh
# 拉取代码
git clone https://github.com/facebook/react.git

# 如果拉取速度很慢，可以考虑使用cnpm代理
git clone https://github.com.cnpmjs.org/facebook/react
```

除去配置文件和隐藏文件夹，根目录的文件夹包括三个：

```
根目录
├── fixtures        # 包含一些给贡献者准备的小型 React 测试项目
├── packages        # 包含元数据（比如 package.json）和 React 仓库中所有 package 的源码（子目录 src）
├── scripts         # 各种工具链的脚本，比如git、jest、eslint等
```

这里我们关注**packages**目录

## packages目录

目录下的文件夹非常多，我们来看下：

### [react](https://github.com/facebook/react/tree/master/packages/react)文件夹

React的核心，包含所有全局 React API，如：

- React.createElement
- React.Component
- React.Children

这些 API 是全平台通用的，它不包含`ReactDOM`、`ReactNative`等平台特定的代码。在 NPM 上作为[单独的一个包](https://www.npmjs.com/package/react)发布。

### [scheduler](https://github.com/facebook/react/tree/master/packages/scheduler)文件夹

Scheduler（调度器）的实现。

### [shared](https://github.com/facebook/react/tree/master/packages/shared)文件夹

源码中其他模块公用的**方法**和**全局变量**，比如在[shared/ReactSymbols.js](https://github.com/facebook/react/blob/master/packages/shared/ReactSymbols.js)中保存`React`不同组件类型的定义。

```js
// ...
export let REACT_ELEMENT_TYPE = 0xeac7;
export let REACT_PORTAL_TYPE = 0xeaca;
export let REACT_FRAGMENT_TYPE = 0xeacb;
// ...
```

### Renderer相关的文件夹

如下几个文件夹为对应的**Renderer**

```
- react-art
- react-dom                 # 注意这同时是DOM和SSR（服务端渲染）的入口
- react-native-renderer
- react-noop-renderer       # 用于debug fiber（后面会介绍fiber）
- react-test-renderer
```

### 试验性包的文件夹

`React`将自己流程中的一部分抽离出来，形成可以独立使用的包，由于他们是试验性质的，所以不被建议在生产环境使用。包括如下文件夹：

```
- react-server        # 创建自定义SSR流
- react-client        # 创建自定义的流
- react-fetch         # 用于数据请求
- react-interactions  # 用于测试交互相关的内部特性，比如React的事件模型
- react-reconciler    # Reconciler的实现，你可以用他构建自己的Renderer
```

### 辅助包的文件夹

`React`将一些辅助功能形成单独的包。包括如下文件夹：

```
- react-is       # 用于测试组件是否是某类型
- react-client   # 创建自定义的流
- react-fetch    # 用于数据请求
- react-refresh  # “热重载”的React官方实现
```

### [react-reconciler](https://github.com/facebook/react/tree/master/packages/react-reconciler)文件夹

我们需要重点关注**react-reconciler**，在接下来源码学习中 80%的代码量都来自这个包。

虽然他是一个实验性的包，内部的很多功能在正式版本中还未开放。但是他一边对接**Scheduler**，一边对接不同平台的**Renderer**，构成了整个 React16 的架构体系。
