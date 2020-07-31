本节我们学习`useState`与`useReducer`。

为什么将他们放在一起学习呢。本质来说，`useState`只是预制了`reducer`的`useReducer`。

## 流程概览

首先梳理下这两个`Hook`的工作流程，我们将其分为`申明阶段`和`调用阶段`。

### 申明阶段

当组件进入`render阶段`，