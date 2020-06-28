当前社区有很多 React 源码分析文章，但不够成体系，内容质量也参差不齐。基于此原因，本书意在通俗易懂、高质量的讲解React源码体系。为了达到这个目标，在行文上，本书会遵循：

1. 不预设观点 —— 所有观点来自React核心团队成员在公开场合发表的内容。
2. 辅助资料详尽 —— 提供在线Demo、参考资源。
3. 代码剪枝 —— 讲解流程时只关注流程相关的代码，省略额外功能的干扰。
4. 保持更新 —— 在React版本更新后会及时补充。当前版本`v16.13.1`。

## 章节说明
从章节列表可以看到，我们并没有从如`ReactDOM.render`、`this.setState`或`hooks`等这样日常开发耳熟能详的`API`入手，而是从**理念**这样比较高的抽象层次开始，这是有意为之的。

由理念推导出架构，再讲解架构的每个部分是如何互相配合完成UI渲染，最后讲解具体的`API`是如何接入这套架构。

自顶向下、抽象程度递减，符合认知的过程。如果直接讲解API，那么很容易陷入源码的汪洋大海。

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

✅ 流程概览

✅ beginWork

✅ completeWork

✅ 双缓存机制

### 第三章 commit阶段

✅ 流程概览

✅ before mutation阶段

✅ mutation阶段

✅ layout阶段

### 第四章 Diff算法

✅ 概览

✅ 单一节点Diff

:black_square_button: 多个节点Diff

### 第五章 状态更新

:black_square_button: Update对象

:black_square_button: ReactDOM.render

:black_square_button: this.setState

:black_square_button: this.forceUpdate

:black_square_button: useState

### 第六章 hook

### 第七章 异步调度



