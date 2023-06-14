// 匹配标签名
const tagName = '[a-zA-Z_][\\-\\.0-9a-zA-Z]*'

// 捕获标签
const tagNameCapture = `((?:${tagName}\\:)?${tagName})`

// 匹配开始标签
const startTagOpen = new RegExp(`^<${tagNameCapture}`)

// 匹配开始标签结束
const startTagClose = /^\s*(\/?)>/

// 匹配结束标签
const endTag = new RegExp(`^<\\/${tagNameCapture}[^>]*>`)

// 匹配属性
const attrReg = /^\s*([^\s"'<>\/=]+)(?:\s*(=)\s*(?:"([^"]*)"+|'([^']*)'+|([^\s"'=<>`]+)))?/

// 匹配插值表达式
const expReg = /\{\{((?:.|\r?\n)+?)\}\}/g


function parserHTML(template) {

  // 标签栈，存储层级
  const stack = []
  // 根标签
  let root = null
  // 当前标签的父级
  let curParent = null


  /**
   * 模版截取
   * @param {*} len 
   */
  function advance(len) {
    template = template.substring(len)
  }

  /**
   * 解析开始标签
   */
  function parseStartTag() {
    // 匹配开始标签
    const start = template.match(startTagOpen)
    console.log(4, start)
    if (start) {
      // 是开始标签
      const match = {
        // 标签名
        tagName: start[1],
        // 属性
        attrs: [],
        // 是否自关闭标签
        isSelfClose: false
      }

      // 截取模版
      advance(start[0].length)


      // 匹配属性，当开始标签未结束时，就是属性
      let attr, end
      while(
        !(end = template.match(startTagClose)) &&
        (attr = template.match(attrReg))
      ) {
        console.log(3, attr)
        // 截取模版, 删除已匹配的属性
        advance(attr[0].length)
        match.attrs.push({
          name: attr[1],
          value: attr[3] || attr[4] || attr[5] || true
        })
      }

      // 标签结束
      if (end) {
        console.log(2, end)
        advance(end[0].length)
        if (end[0] === '/>') {
          match.isSelfClose = true
        }
      }

      return match
    }

    // 不是开始标签
    return false    
  }


  /**
   * 处理开始标签，构建AST
   * @param {} match 
   */
  function start(match) {
    const node = createASTElement(match.tagName, match.attrs)

    root = root || node

    curParent && (curParent.children.push(node), node.parent = curParent)

    stack.push(node)

    curParent = node
  }

  /**
   * 解析文本
   */
  function parseText() {

  }

  function createASTElement(tag, attrs) {
    return {
      tag,
      attrs,
      parent: null,
      children: [],
      type: 1
    }
  }


  /**
   * 处理结束标签
   */
  function end(match) {
    const node = stack.pop()
    if (node.tag !== match[1]) {
      throw new Error('tag name not match')
    }

    curParent = stack[stack.length - 1]
  }

  /**
   * 解析文本
   * @param {*} text 
   */
  function parseText(text) {
    // 去除空格
    text = text.trim()
    if (!text) return

    let matched, tokens = [], beginIndex = 0
    while (matched = expReg.exec(text)) {

      if (matched.index > beginIndex) {
        tokens.push(JSON.stringify(text.slice(beginIndex, matched.index)))
      }
      const exp = matched[1].trim()
      tokens.push(`_s(${exp})`)
      beginIndex = matched.index + matched[0].length
    }


    curParent.children.push({
      type: 'text',
      text: tokens.join('+'),
      parent: curParent
    })
  }


  while(template) {
    // 首先寻找 < 的位置，如果为0，则是开始标签，大于0 则是文本的结束位置

    const textEndIndex = template.indexOf('<')
    if (textEndIndex === 0) {
      const startTagMatch = parseStartTag()
      if (startTagMatch) {
        start(startTagMatch)
        continue
      }
      
      const endTagMatch = template.match(endTag)
      if (endTagMatch) {
        advance(endTagMatch[0].length)
        end(endTagMatch)
        continue
      }
    } else {
      // 文本
      let textLen = textEndIndex > 0 ? textEndIndex : template.length
      const text = template.substring(0, textLen)
      // if (text) {
        advance(textLen)
        parseText(text)
      // }
    }
  }

  return root
}

const ast = parserHTML(`
<div class="log-content">
  <p v-if="showTitle">this is {{ text }} of {{has}}</p>
  <span v-for="item in list" :key="item.id">{{item.text}}</span>
  <div class="log-box">
    <pre v-highlight="logStr"  ref="code"><code class="language-bash">
    </code></pre>
  </div>
</div>
`)
console.log(ast.children[0].children)