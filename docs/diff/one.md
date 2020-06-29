对于单个节点，我们以类型`object`为例，会进入`reconcileSingleElement`

> 你可以从[这里](https://github.com/facebook/react/blob/master/packages/react-reconciler/src/ReactChildFiber.new.js#L1133)看到`reconcileSingleElement`源码

```javascript
  const isObject = typeof newChild === 'object' && newChild !== null;

  if (isObject) {
    // 对象类型，可能是 REACT_ELEMENT_TYPE 或 REACT_PORTAL_TYPE
    switch (newChild.$$typeof) {
      case REACT_ELEMENT_TYPE:
        // 调用 reconcileSingleElement 处理
      // ...其他case
    }
  }
```
这个函数会做如下事情：

<img :src="$withBase('/img/diff.png')" alt="diff">

让我们看看第二步**判断DOM节点是否可以复用**是如何实现的。

```javascript
function reconcileSingleElement(
  returnFiber: Fiber,
  currentFirstChild: Fiber | null,
  element: ReactElement
): Fiber {
  const key = element.key;
  let child = currentFirstChild;
  
  // 首先判断是否存在对应DOM节点
  while (child !== null) {
    // 上一次更新存在DOM节点，接下来判断是否可复用

    // 首先比较key是否相同
    if (child.key === key) {

      // key相同，接下来比较type是否相同

      switch (child.tag) {
        // ...省略case
        
        default: {
          if (child.elementType === element.type) {
            // type相同则表示可以复用
            // 返回复用的fiber
            return existing;
          }
          
          // type不同则跳出循环
          break;
        }
      }
      // 代码执行到这里代表：key相同但是type不同
      // 将该fiber及其兄弟fiber标记为删除
      deleteRemainingChildren(returnFiber, child);
      break;
    } else {
      // key不同，将该fiber标记为删除
      deleteChild(returnFiber, child);
    }
    child = child.sibling;
  }

  // 创建新Fiber，并返回 ...省略
}
```

还记得我们刚才提到的，React预设的限制么，

从代码可以看出，React通过先判断`key`是否相同，如果`key`相同则判断`type`是否相同，只有都相同时一个`DOM节点`才能复用。

这里有个细节需要关注下：

- 当`child !== null`且`key相同`且`type不同`时执行`deleteRemainingChildren`将`child`及其兄弟`fiber`都标记删除。

- 当`child !== null`且`key不同`时仅将`child`标记删除。

考虑如下例子：

当前页面有3个`li`，我们要全部删除，再插入一个`p`。

```js
// 当前页面显示的
ul > li * 3

// 这次需要更新的
ul > p
```

由于本次更新时只有一个`p`，属于单一节点的`Diff`，会走上面介绍的代码逻辑。

在`reconcileSingleElement`中遍历之前的3个`fiber`（对应的`DOM`为3个`li`），寻找本次更新的`p`是否可以复用之前的3个`fiber`中某个的`DOM`。

当`key相同`且`type不同`时，代表我们已经找到本次更新的`p`对应的上次的`fiber`，但是`p`与`li` `type`不同，不能复用。既然唯一的可能性已经不能复用，则剩下的`fiber`都没有机会了，所以都需要标记删除。

当`key不同`时只代表遍历到的该`fiber`不能被`p`复用，后面还有兄弟`fiber`还没有遍历到。所以仅仅标记该`fiber`删除。


## 练习题
让我们来做几道习题巩固下吧：

请判断如下`JSX对象`对应的`DOM`元素是否可以复用：

```jsx
// 习题1 更新前
<div>ka song</div>
// 更新后
<p>ka song</p>

// 习题2 更新前
<div key="xxx">ka song</div>
// 更新后
<div key="ooo">ka song</div>

// 习题3 更新前
<div key="xxx">ka song</div>
// 更新后
<p key="ooo">ka song</p>

// 习题4 更新前
<div key="xxx">ka song</div>
// 更新后
<div key="xxx">xiao bei</div>

```

。

。

。

。

公布答案：

习题1: 未设置`key prop`默认 `key = null;`，所以更新前后key相同，都为`null`，但是更新前`type`为`div`，更新后为`p`，`type`改变则不能复用。

习题2: 更新前后`key`改变，不需要再判断`type`，不能复用。

习题3: 更新前后`key`改变，不需要再判断`type`，不能复用。

习题4: 更新前后`key`与`type`都未改变，可以复用。`children`变化，`DOM`的子元素需要更新。

你是不是都答对了呢。