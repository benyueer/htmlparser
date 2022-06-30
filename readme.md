# HTML parser

将HTML字符串转换为AST是构建虚拟NODE、模版指令等解析的基本功能，将模版转换为AST后可以得到详细的语法描述、层级关系和参数列表，有助于通过js重新渲染出进行过变量求值后的DOM，同时可以进行优化和其他转换工作

进行HTML解析的工具有很多，早期模版引擎时代就有基于Java、PHP等语言的工具，当前端框架兴起时，虚拟DOM的概念也被使用，开发者只要定义好模版就能得到渲染完成的DOM，从模版到DOM的过程较为复杂，第一步就是解析成AST，有了AST后之后的操作就方便许多

现有的此类工具有很多，例如`hemlparser2`等，VUE的解析功能也是基于此库开发，此项目是为了学习模版编译过程，只实现了最基础的版本，本人能力有限，以后有时间了会继续丰富完整的模版解析

### 基本流程

在解析模版字符串时，分为两种情况：以`<`开头和不以此开头
不以`<`开头时就是字符（或插值表达式）
以`<`开头就分为一下情况
1. 开始标签
2. 结束标签
3. 注释标签
4. 文档声明

可描述为：
```js

while(template.length) {

  if (template[0] === '<') {
    const isStartTag = template.match(startTag)
    if(isStartTag) {
      // 开始标签
      parseStartTag()
      continue
    }
    const isEndTag = template.match(endTag)
    if (isEndTag) {
      // 结束标签
      parseEndTag()
    }
  } else {
    // 文本
    parseText()
  }
}

```

例如有以下模版：
```html
<div class="red">
  <span>hello world</span>
</div>
```
首先找到`<`，`index===0`说明为标签
通过正则匹配为‘开始标签’
截取出开始标签
```html
<div class="red>
```
解析这一部分，得到一个`AST node`
```js
{
  tag: div,
  attrs: [
    {
      name: class,
      value: 'red'
    }
  ]
}
```
接着匹配剩下的模版，发现`<span>`也是一个标签，现在就有一个问题，标签间的层级关系怎么处理呢？引入一个栈，碰到开始标签时将标签对应`node`入栈，那么匹配子级标签时子标签的父级就是栈顶元素，然后将子标签入栈；当匹配到结束标签时，表示当前标签已匹配完成，要将其出栈
所以，匹配到`<span>`时，`stack = [{tag: div}]`
在生成`<span>`的`node`时就有了`parent`属性
```js
curparent = stack.pop() // 实际这一步在node入栈时已完成

node = {
  tag: span,
  parent: curParent
}

curParent.children.push(node)

stack.push(node)

curParent = node
```