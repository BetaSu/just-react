本书的宗旨是打造一本严谨、易懂的`React`源码分析教程。

为了达到这个目标，在行文上，本书会遵循：

1. 不预设观点 —— 所有观点来自React核心团队成员在公开场合发表的内容。

2. 丰富的参考资料 —— 包括在线Demo、文章、视频。

3. 代码剪枝 —— 讲解流程时只关注流程相关的代码，省略额外功能的干扰。

4. 保持更新 —— 在`React`版本更新后会及时补充。当前版本`v16.13.1 master分支`。

## 章节说明

我们并没有从如`ReactDOM.render`、`this.setState`或`Hooks`等这样日常开发耳熟能详的`API`入手，而是从**理念**这样比较高的抽象层次开始学习，这是有意为之的。

从理念到架构，从架构到实现，从实现到具体代码。

这是一个自顶向下、抽象程度递减，符合认知的过程。如果直接讲解API，那么很容易陷入源码的汪洋大海。

## 章节列表

### 第一章 前置知识

✅ React理念

✅ 老的React架构

✅ 新的React架构

✅ 源码的文件结构

✅ 调试源码

✅ 深入理解JSX

✅ 总结

### 第二章 render阶段

✅ Fiber架构

✅ 双缓存机制

✅ 流程概览

✅ beginWork

✅ completeWork

### 第三章 commit阶段

✅ 流程概览

✅ before mutation阶段

✅ mutation阶段

✅ layout阶段

### 第四章 Diff算法

✅ 概览

✅ 单节点Diff

✅ 多节点Diff

### 第五章 状态更新

✅ 流程概览

✅ Update

:black_square_button: Update的优先级

:black_square_button: ReactDOM.render

:black_square_button: this.setState

:black_square_button: this.forceUpdate

### 第六章 Hooks

### 第七章 异步调度



