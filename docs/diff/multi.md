
上一节我们介绍了单一元素的`Diff`，现在考虑我们有一个`FunctionComponent`：

```jsx
function List () {
    return (
        <ul>
            <li key="0">0</li>
            <li key="1">1</li>
            <li key="2">2</li>
            <li key="3">3</li>
        </ul>
    )
}
```
他的返回值`JSX`对象的`children`属性不是单一元素，而是包含四个对象的数组

```js
{
  $$typeof: Symbol(react.element),
  key: null,
  props: {
    children: [
      {$$typeof: Symbol(react.element), type: "li", key: "0", ref: null, props: {…}, …}
      {$$typeof: Symbol(react.element), type: "li", key: "1", ref: null, props: {…}, …}
      {$$typeof: Symbol(react.element), type: "li", key: "2", ref: null, props: {…}, …}
      {$$typeof: Symbol(react.element), type: "li", key: "3", ref: null, props: {…}, …}
    ]
  },
  ref: null,
  type: "ul"
}
```

这种情况下，`reconcileChildFibers`的`newChild`参数为`Array`，在`reconcileChildFibers`函数内部对应如下情况：

```js
  if (isArray(newChild)) {
    // 调用 reconcileChildrenArray 处理
    // ...省略
  }
```

这一节我们来看看，如何处理同级多个元素的`Diff`。

## 概览

首先归纳下我们需要处理的情况：

我们以**之前**代表

### 情况1：节点更新

```jsx
// 之前
<ul>
    <li key="0" className="before">0<li>
    <li key="1">1<li>
</ul>

// 之后情况1 节点属性变化
<ul>
    <li key="0" className="after">0<li>
    <li key="1">1<li>
</ul>

// 之后情况2 节点类型更新
<ul>
    <div key="0">0<li>
    <li key="1">1<li>
</ul>
```

### 情况2：节点新增或减少

```jsx
// 情况2 节点新增或减少

// 之前
<ul>
    <li key="0">0<li>
    <li key="1">1<li>
</ul>

// 之后情况1 新增节点
<ul>
    <li key="0">0<li>
    <li key="1">1<li>
    <li key="2">2<li>
</ul>

// 之后情况2 删除节点
<ul>
    <li key="1">1<li>
</ul>
```

### 情况3：节点位置变化

```jsx
// 情况3 节点位置变化

// 之前
<ul>
    <li key="0">0<li>
    <li key="1">1<li>
</ul>

// 之后
<ul>
    <li key="1">1<li>
    <li key="0">0<li>
</ul>
```

同一次同级多个元素的`Diff`，一定属于以上三种情况中的一种或多种。

该如何设计算法呢

如果让我设计一个Diff算法，我首先想到的方案是：

1. 判断当前节点的更新属于哪种情况
2. 如果是新增，执行新增逻辑
3. 如果是删除，执行删除逻辑
4. 如果是更新，执行更新逻辑

按这个方案，其实有个隐含的前提——**不同操作的优先级是相同的**

但React团队发现，在日常开发中，相对于增加和删除，更新组件发生的频率更高。所以React Diff会优先判断当前节点是否属于更新。

值得注意的是，在我们做数组相关的算法题时，经常使用双指针从数组头和尾同时遍历以提高效率，但是这里却不行。

虽然本次更新的JSX对象`newChildren`为数组形式，但是和`newChildren`中每个值进行比较的是上次更新的Fiber节点，Fiber节点的同级节点是由`sibling`指针链接形成的链表。

即 `newChildren[0]`与`oldFiber`比较，`newChildren[1]`与`oldFiber.sibling`比较。

单链表无法使用双指针，所以无法对算法使用双指针优化。



基于以上原因，Diff算法的整体逻辑会经历两轮遍历。

第一轮遍历：处理更新的节点。

第二轮遍历：处理剩下的不属于更新的节点。

### 第一轮遍历 😄

第一轮遍历步骤如下：


1. 遍历`newChildren`，`i = 0`，将`newChildren[i]`与`oldFiber`比较，判断DOM节点是否可复用。
2. 如果可复用，`i++`，比较`newChildren[i]`与`oldFiber.sibling`是否可复用。可以复用则重复步骤2。
3. 如果不可复用，立即跳出整个遍历。
4. 如果`newChildren`遍历完或者`oldFiber`遍历完（即`oldFiber.sibling === null`），跳出遍历。

当我们最终完成遍历后，会有两种结果：

结果一： 如果是步骤3跳出的遍历，`newChildren`没有遍历完，`oldFiber`也没有遍历完。

举个栗子🌰

如下代码中，前2个节点可复用，`key === 2`的节点`type`改变，不可复用，跳出遍历。

此时`oldFiber`剩下`key === 2`未遍历，`newChildren`剩下`key === 2`、`key === 3`未遍历。

```jsx
// 之前
            <li key="0">0</li>
            <li key="1">1</li>
            <li key="2">2</li>
            
// 之后
            <li key="0">0</li>
            <li key="1">1</li>
            <div key="2">2</div>
            <li key="3">3</li>
```

结果二： 如果是步骤4跳出的遍历，可能`newChildren`遍历完，或`oldFiber`遍历完，或他们同时遍历完。

再来个🌰


```jsx
// 之前
            <li key="0" className="a">0</li>
            <li key="1" className="b">1</li>
            
// 之后情况1 newChildren与oldFiber都遍历完
            <li key="0" className="aa">0</li>
            <li key="1" className="bb">1</li>
            
// 之后情况2 newChildren没遍历完，oldFiber遍历完
            <li key="0" className="aa">0</li>
            <li key="1" className="bb">1</li>
            <li key="2" className="cc">2</li>
            
// 之后情况3 newChildren遍历完，oldFiber没遍历完
            <li key="0" className="aa">0</li>
```

带着这两种结果，我们开始第二轮遍历。

### 第二轮遍历 🎉🎉🎉

对于结果二，聪明的你想一想🐯，`newChildren`没遍历完，`oldFiber`遍历完意味着什么？

老的DOM节点都复用了，这时还有新加入的节点，意味着本次更新有新节点插入，我们只需要遍历剩下的`newChildren`依次执行插入操作（`Fiber.effectTag = Placement;`）。

同样的，我们举一反三。`newChildren`遍历完，`oldFiber`没遍历完意味着什么？

意味着多余的`oldFiber`在这次更新中已经不存在了，所以需要遍历剩下的`oldFiber`，依次执行删除操作（`Fiber.effectTag = Deletion;`）。

那么结果一怎么处理呢？`newChildren`与`oldFiber`都没遍历完，这意味着有节点在这次更新中改变了位置。

接下来，就是Diff算法最精髓的部分！！！！ 打起精神来，我们胜利在望 ✌️ ✌️ ✌️

### 处理位置交换的节点

由于有节点交换了位置，所以不能再用位置索引对比前后的节点，那么怎样才能将同一个节点在两次更新中对应上呢？

你一定想到了，我们需要用`key`属性了。

为了快速的找到`key`对应的`oldFiber`，我们将所有还没处理的`oldFiber`放进以`key`属性为key，`Fiber`为value的`map`。

```javascript
const existingChildren = mapRemainingChildren(returnFiber, oldFiber);
```

再遍历剩余的`newChildren`，通过`newChildren[i].key`就能在`existingChildren`中找到`key`相同的`oldFiber`。

接下来是重点哦，敲黑板 👨‍🏫

在我们第一轮和第二轮遍历中，我们遇到的每一个可以复用的节点，一定存在一个代表上一次更新时该节点状态的`oldFiber`，并且页面上有一个DOM元素与其对应。

那么我们在Diff函数的入口处，定义一个变量
```javascript
let lastPlacedIndex = 0;
```
该变量表示当前最后一个可复用节点，对应的`oldFiber`在上一次更新中所在的位置索引。我们通过这个变量判断节点是否需要移动。

是不是有点绕，😷😷😷 不要怕，老师的栗子又来啦🌰🌰🌰

这里我们简化一下书写，每个字母代表一个节点，字母的值代表节点的`key`
```jsx

// 之前
abcd

// 之后
acdb

===第一轮遍历开始===
a（之后）vs a（之前）  
key不变，可复用
此时 a 对应的oldFiber（之前的a）在之前的数组（abcd）中索引为0
所以 lastPlacedIndex = 0;

继续第一轮遍历...

c（之后）vs b（之前）  
key改变，不能复用，跳出第一轮遍历
此时 lastPlacedIndex === 0;
===第一轮遍历结束===

===第二轮遍历开始===
newChildren === cdb，没用完，不需要执行删除旧节点
oldFiber === bcd，没用完，不需要执行插入新节点

将剩余oldFiber（bcd）保存为map

// 当前oldFiber：bcd
// 当前newChildren：cdb

继续遍历剩余newChildren

key === c 在 oldFiber中存在
const oldIndex = c（之前）.index;
即 oldIndex 代表当前可复用节点（c）在上一次更新时的位置索引
此时 oldIndex === 2;  // 之前节点为 abcd，所以c.index === 2
比较 oldIndex 与 lastPlacedIndex;

如果 oldIndex >= lastPlacedIndex 代表该可复用节点不需要移动
并将 lastPlacedIndex = oldIndex;
如果 oldIndex < lastplacedIndex 该可复用节点之前插入的位置索引小于这次更新需要插入的位置索引，代表该节点需要向右移动

在例子中，oldIndex 2 > lastPlacedIndex 0，
则 lastPlacedIndex = 2;
c节点位置不变

继续遍历剩余newChildren

// 当前oldFiber：bd
// 当前newChildren：db

key === d 在 oldFiber中存在
const oldIndex = d（之前）.index;
oldIndex 3 > lastPlacedIndex 2 // 之前节点为 abcd，所以d.index === 3
则 lastPlacedIndex = 3;
d节点位置不变

继续遍历剩余newChildren

// 当前oldFiber：b
// 当前newChildren：b

key === b 在 oldFiber中存在
const oldIndex = b（之前）.index;
oldIndex 1 < lastPlacedIndex 3 // 之前节点为 abcd，所以b.index === 1
则 b节点需要向右移动
===第二轮遍历结束===

最终acd 3个节点都没有移动，b节点被标记为移动

```

相信你已经明白了节点移动是如何判断的。如果还有点懵逼，正常的～～ 我们再看一个栗子～～

😁😁😁

```jsx
// 之前
abcd

// 之后
dabc

===第一轮遍历开始===
d（之后）vs a（之前）  
key不变，type改变，不能复用，跳出遍历
===第一轮遍历结束===

===第二轮遍历开始===
newChildren === dabc，没用完，不需要执行删除旧节点
oldFiber === abcd，没用完，不需要执行插入新节点

将剩余oldFiber（abcd）保存为map

继续遍历剩余newChildren

// 当前oldFiber：abcd
// 当前newChildren dabc

key === d 在 oldFiber中存在
const oldIndex = d（之前）.index;
此时 oldIndex === 3; // 之前节点为 abcd，所以d.index === 3
比较 oldIndex 与 lastPlacedIndex;
oldIndex 3 > lastPlacedIndex 0
则 lastPlacedIndex = 3;
d节点位置不变

继续遍历剩余newChildren

// 当前oldFiber：abc
// 当前newChildren abc

key === a 在 oldFiber中存在
const oldIndex = a（之前）.index; // 之前节点为 abcd，所以a.index === 0
此时 oldIndex === 0;
比较 oldIndex 与 lastPlacedIndex;
oldIndex 0 < lastPlacedIndex 3
则 a节点需要向右移动

继续遍历剩余newChildren

// 当前oldFiber：bc
// 当前newChildren bc

key === b 在 oldFiber中存在
const oldIndex = b（之前）.index; // 之前节点为 abcd，所以b.index === 1
此时 oldIndex === 1;
比较 oldIndex 与 lastPlacedIndex;
oldIndex 1 < lastPlacedIndex 3
则 b节点需要向右移动

继续遍历剩余newChildren

// 当前oldFiber：c
// 当前newChildren c

key === c 在 oldFiber中存在
const oldIndex = c（之前）.index; // 之前节点为 abcd，所以c.index === 2
此时 oldIndex === 2;
比较 oldIndex 与 lastPlacedIndex;
oldIndex 2 < lastPlacedIndex 3
则 c节点需要向右移动

===第二轮遍历结束===

```

可以看到，我们以为从 `abcd` 变为 `dabc`，只需要将`d`移动到前面。

但实际上React保持`d`不变，将`abc`分别移动到了`d`的后面。

从这点可以看出，考虑性能，我们要尽量减少将节点从后面移动到前面的操作。

相信经过这么多多多栗子，你已经懂了Diff原理，为自己鼓鼓掌吧👏👏👏

全部带注释代码[见这里](https://github.com/BetaSu/react-on-the-way/blob/master/packages/react-reconciler/ReactChildFiber.js#L265)

# 总结

我们前三篇文章分别讲解了

- [首屏渲染流程](https://juejin.im/post/5e9abf06e51d454702460bf6)
- [组件更新流程](https://juejin.im/post/5eb9030b6fb9a043333c6071)
- 更新与更新之间的Diff逻辑

至此，整个React的渲染逻辑就完结了。

在之后的章节中，我们会一起实现异步调度器`Scheduler`，再用调度器来为我们的React做时间切片。 💪 💪 💪
