本书的宗旨是打造一本严谨、易懂的`React`源码分析教程。

为了达到这个目标，在行文上，本书会遵循：

1. 不预设观点 —— 所有观点来自`React`核心团队成员在公开场合的分享。

2. 丰富的参考资料 —— 包括在线Demo、文章、视频。

3. 代码剪枝 —— 讲解流程时只关注流程相关的代码，省略额外功能的干扰。

4. 保持更新 —— 在`React`版本更新后会及时补充。当前版本`v17.0.0-alpha`。

## 章节说明

我们并没有从如`ReactDOM.render`、`this.setState`或`Hooks`等这些日常开发耳熟能详的`API`入手，而是从**理念**这样比较高的抽象层次开始学习，这是有意为之的。

从理念到架构，从架构到实现，从实现到具体代码。

这是一个自顶向下、抽象程度递减，符合认知的过程。如果直接讲解API，那么很容易陷入源码的汪洋大海。

基于此，本书划分为`理念篇`、`架构篇`、`实现篇`。

## 章节列表

### 理念篇

#### 第一章 React理念

✅ React理念

✅ 老的React架构

✅ 新的React架构

✅ Fiber架构的心智模型

✅ Fiber架构的实现原理

✅ Fiber架构的工作原理

✅ 总结

#### 第二章 前置知识

✅ 源码的文件结构

✅ 调试源码

✅ 深入理解JSX

### 架构篇

#### 第三章 render阶段

✅ 流程概览

✅ beginWork

✅ completeWork

#### 第四章 commit阶段

✅ 流程概览

✅ before mutation阶段

✅ mutation阶段

✅ layout阶段

### 实现篇

#### 第五章 Diff算法

✅ 概览

✅ 单节点Diff

✅ 多节点Diff

#### 第六章 状态更新

✅ 流程概览

✅ 心智模型

✅ Update

✅ 深入理解优先级

✅ ReactDOM.render

✅ this.setState

#### 第七章 Hooks

✅ Hooks理念

✅ 极简Hooks实现

✅ Hooks数据结构

✅ useState与useReducer

:black_square_button: useEffect与useLayoutEffect

:black_square_button: useRef与useImperativeHandle

#### 第八章 异步调度

:black_square_button: 🏠🔧

#### 第九章 context