[TOC]

# EduLens—项目心得

## 浏览器插件开发
------

### 插件架构

- manifest：插件配置文件
- content_script：注入到浏览器页面的脚本
- service_worker：插件自己的后台脚本
- extension page：插件的各个页面，比如popup、options、devtools、sidepanel
- browser api：可以通过api调用浏览器的功能（存储、历史记录、通信等

首先manifest是一个json文件，配置了插件的信息，其余部分的内容都需要在这里配置（当然也可以在service_worker中动态配置）；需要放在插件的根目录下

browser api是插件与浏览器交互的通道；根据浏览器不同，可能有些差异，但大部分的api是一致的

content_script是注入到浏览器页面的脚本，可以实现修改页面的dom，获取页面元素等操作。他能使用的browser api是有限的，想实现一些功能需要与service_worker或者extension page通信，由这两部分的代码代为执行一些操作。

service_worker相当于是插件的后端，也就是一个在后台运行的脚本，能够访问到所有的browser api。控制浏览器的操作都可以在这里运行

extension page是插件内部的一些页面。有一些页面是插件规定的，比如popup、options、devtools、sidePanel等；还有一些页面是插件自定义的页面，可以通过browser api打开这些页面。在extension page也可以使用所有的browser api



### 开发流程

1. 启动开发服务器
`npm run dev`

2. 在 Chrome 中加载插件


- 打开 chrome://extensions/
- 开启"开发者模式"
- 点击"加载已解压的扩展程序"
- 选择 dist 目录

3. 修改代码后自动热更新 然后在浏览器中测试功能



### 调试方法

#### 内容脚本调试

1. 打开目标网页

2. 按 F12 打开开发者工具

3. 在 Console 中测试

```js
chrome.runtime.sendMessage({action: 'toggleFeature', feature: 'highlight'})
```

#### Popup 调试

1. 点击插件图标打开 popup

2. 右键 popup 窗口选择"检查"

#### Background 调试

1. 打开 chrome://extensions/

2. 找到插件，点击"检查视图"中的 Service Worker 

#### 日志调试

​	使用 chrome.storage 调试：

```js
chrome.storage.sync.get('settings', (data) => {
  console.log('当前设置:', data)
})
```

------

### 错误解决：

------

#### 加载扩展时scss文件报错

> `无法为脚本加载重叠样式表“src/assets/styles/main.scss”`

浏览器扩展**不能直接加载 `.scss` 文件**，也**不能使用 `src/...` 这样的源码路径**，它只能读取打包后 `dist/` 目录里的**最终构建产物**（如 `.css`、`.js` 等）。

---
错误写法：
```json
"content_scripts": [
  {
    "matches": ["<all_urls>"],
    "js": ["src/content.js"],
    "css": ["src/assets/styles/main.scss"]
  }
]
```

应该用 Vite 或 CRXJS 插件去**处理 `.scss` 并输出为 `.css`**，然后引用打包后的路径。

**正确写法示例（ CRXJS）：**

```json
"content_scripts": [
  {
    "matches": ["<all_urls>"],
    "js": ["content.js"],
    "css": ["assets/main.css"]
  }
]
```

> 注意：`content.js` 和 `assets/main.css` 是**构建后 dist 目录中的路径**，不是源码。

---

**3. 如何配置 Vite（CRXJS）来处理 `.scss`**

如果你用 CRXJS，它会自动处理 `.scss`，你只需要：

- 在 `content.js` 里引入 `.scss` 文件：

  ```ts
  import './assets/styles/main.scss';
  ```

- 然后在 `manifest.json` 中**不要手动写 `css` 字段**，CRXJS 会自动注入。




------


#### 提交项目时github连接失败

**原因：**
使用clash代理导致github代理出错

**解决：**

```
git config --global http.proxy  http://127.0.0.1:7890
git config --global https.proxy http://127.0.0.1:7890
```



------

#### 打包后路径依赖问题

**问题：**
Failed to fetch dynamically imported module: chrome-extension://apkjdjeifklnkjdoadlkpbpfcnfgkanf/content-scripts/main.js


**原因：**
没有自定义 output.entryFileNames，所以 Vite 默认会输出为 content.js，而不是 dist/content-scripts/main.js

**解决：**
在vite.config.js文件中添加

```js
  output: {
    entryFileNames: (chunkInfo) => {
      if (chunkInfo.name === 'content') {
        return 'content-scripts/main.js';
      }
      if (chunkInfo.name === 'background') {
        return 'background.js';
      }
      return '[name].js';
    },
    chunkFileNames: 'assets/[name].js',
    assetFileNames: 'assets/[name].[ext]'
  }
```

自行指定输出的文件结构



------

#### Popup窗口闪烁问题

**原因：**

- crxjs 在开发模式下会自动生成一个 loading 页面，等待 Vite Dev Server 连接。如果 Vite 没有正常启动或 popup 入口配置不对，就会一直显示这个页面。
- Vite 的 client 脚本（如热重载、错误覆盖层）在 Chrome 扩展环境下经常不兼容，容易报错。

**解决：**
直接访问 Vite Dev Server 的 popup 页面（ http://localhost:5173/src/popup/index.html）




------

#### Css文件打包后不存在或出错

**原因：**
在 vite.config.js 的 rollupOptions.input 中加入了 styles: 'public/style.css'，导致 Vite/rollup 试图将 style.css 作为 JS/HTML 入口处理，所以报错

**解决：**

- 不要在 rollupOptions.input 里加入 CSS 文件入口，只保留 JS/HTML 入口即可。
- 将css移动到public文件夹，并manifest.json 里 css 路径设置为 "style.css"（ style.css 构建后会自动复制到 dist 根目录）。



------










## JavaScript相关

### 获取滚动距离

------

```js
  const scrollTop  = window.scrollY;
  const docHeight  = document.documentElement.scrollHeight;
  const winHeight  = window.innerHeight;
  //docHeight - winHeight 才能得到需要滚动才能到底的剩余距离
  const progressPct = (scrollTop / (docHeight - winHeight)) * 100;
```

1. `const scrollTop = window.scrollY;`

- 当前页面**已经向上滚动的像素值**。

2. `const docHeight = document.documentElement.scrollHeight;`

- 整个网页的**总高度**（包括可视区域 + 隐藏区域）。

3. `const winHeight = window.innerHeight;`

- 浏览器窗口的**可视区域高度**（即“一屏”的高度）。

4. `const progressPct = (scrollTop / (docHeight - winHeight)) * 100;`

- 计算当前滚动进度占总可滚动距离的百分比。
- **关键点**：`docHeight - winHeight` 表示**真正需要滚动的距离**。
- **公式**：已滚动距离 ÷ 可滚动总距离 × 100%



###  鼠标追踪元素定位错乱

------

**原因：**使用transform来追踪鼠标位置，只设置了`position:fixed;`，没有设置`top/left`值，导致元素跟随文档流生成在网站最底部

**解决：**

```js
//记得写明初始top和left值，否则fixed定位错乱
  highlightDiv.style.left = 0+ 'px';
  highlightDiv.style.top = 0 + 'px';
```



### 获取元素的位置方法

------

1.**相对于视口（Viewport）的位置**

 `Element.getBoundingClientRect()`

- **返回对象**：`DOMRect`（包含`x, y, width, height, top, left, right, bottom`）
- **坐标系**：相对于**当前视口**（viewport）的左上角
- **用途**：获取元素在**可视区域**中的精确位置，常用于判断元素是否可见、实现懒加载等
- **特点**：会受滚动影响，即滚动页面后值会变化

```js
const rect = element.getBoundingClientRect();
console.log(rect.top, rect.left); // 元素相对于视口的位置
```

------

2. **相对于整个文档（Document）的位置**

 `Element.offsetTop` / `Element.offsetLeft`

- **返回类型**：`number`
- **坐标系**：相对于**最近的定位祖先元素**（offsetParent）
- **用途**：快速获取元素相对于其定位容器的位置
- **注意**：如果祖先元素中有定位（`position`不为`static`），则相对于该元素；否则相对于`<body>`

 `Element.offsetParent`

- **返回类型**：`Element` 或 `null`
- **用途**：找到当前元素的定位祖先元素（用于配合`offsetTop/Left`计算绝对位置）

---

 3. **相对于最近滚动容器的位置**

 `Element.scrollTop` / `Element.scrollLeft`

- **返回类型**：`number`
- **用途**：获取或设置**元素自身内容**的滚动距离（注意：这个是可写的）
- **注意**：这两个属性是**元素自身**的滚动距离，不是相对于其他元素的位置

 `Element.scrollHeight` / `Element.scrollWidth`

- **返回类型**：`number`
- **用途**：获取元素的**完整滚动高度/宽度**（包括不可见部分）

---

 4. **相对于鼠标事件的位置**

 **`MouseEvent` 相关属性（事件对象中）**

- `clientX` / `clientY`：相对于**视口**的坐标
- `pageX` / `pageY`：相对于**整个文档**的坐标
- `offsetX` / `offsetY`：相对于**事件目标元素**的坐标
- `screenX` / `screenY`：相对于**整个屏幕**的坐标

---

 5. **现代API：`IntersectionObserver`（观察可见性）**

虽然不是直接获取位置，但常用于判断元素是否在视口内：

```js
const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    console.log(entry.isIntersecting); // 是否可见
    console.log(entry.boundingClientRect); // 相对于视口的位置
  });
});
observer.observe(element);
```

------

**总结：**

- **获取元素在视口中的位置**：用 `getBoundingClientRect()`。
- **获取元素在文档中的绝对位置**：手动累加`offsetTop/Left`。
- **判断元素是否可见**：用 `IntersectionObserver`。
- **处理鼠标事件**：用事件对象中的`clientX/Y`或`pageX/Y`。



### 可拖动元素

------

**方法一：HTML5 原生拖放 API（`draggable=true`）**

- 简单的拖拽排序、拖拽上传、拖拽到回收站等。
- 不需要实时控制元素位置。
- 拖动前后元素位置不变

```html
<div id="draggable" draggable="true">拖动我</div>

<script>
  const el = document.getElementById('draggable');

  el.addEventListener('dragstart', (e) => {
    e.dataTransfer.setData('text/plain', 'dragging');
  });

  document.addEventListener('dragover', (e) => {
    e.preventDefault(); // 必须阻止默认行为才允许放置
  });

  document.addEventListener('drop', (e) => {
    e.preventDefault();
    alert('你把我放下了！');
  });
</script>
```

------

**方法二：鼠标事件实现自定义拖动（更灵活，常用于浮动窗口、拖拽组件）**

- 实现可自由拖动的浮动面板、弹窗、图表节点等。
- 需要实时控制元素的位置。
- 拖动前后元素位置会改变并保持

```html
<div id="box" style="position: absolute; width: 100px; height: 100px; background: skyblue; cursor: move;">
  拖动我
</div>

<script>
  const box = document.getElementById('box');
  let isDragging = false;
  let offsetX = 0, offsetY = 0;

  box.addEventListener('mousedown', (e) => {
    isDragging = true;
    //e.clientX —— 鼠标相对于视口的横坐标。
    //box.offsetLeft —— 方块相对于定位祖先的横坐标
    //二者相减得到“鼠标点击点距离方块左边框”的距离,这样拖动时按钮不会瞬间跳到鼠标位置
    offsetX = e.clientX - box.offsetLeft;
    offsetY = e.clientY - box.offsetTop;
    //防止拖动时选中文本
    box.style.userSelect = 'none';
  });

  document.addEventListener('mousemove', (e) => {
    if (!isDragging) return; //确保在拖动状态下才能移动
    box.style.left = (e.clientX - offsetX) + 'px';
    box.style.top = (e.clientY - offsetY) + 'px';
  });

  document.addEventListener('mouseup', () => {
    isDragging = false;
    box.style.userSelect = '';// 恢复文字可选中
  });
</script>
```

------

**为什么`mousemove`事件监听 `document` 而不是 `box`？**

如果用户鼠标移动得快，可能一瞬间就离开了方块本身，`box` 就再也收不到事件了。绑在 `document` 上，无论鼠标在哪都能继续拖动。

------

**如何将拖动范围限制在窗口内？**

```js
   const left = Math.max(0, Math.min(window.innerWidth - buttonDiv.offsetWidth, e.clientX - offsetX));
   const top = Math.max(0, Math.min(window.innerHeight - buttonDiv.offsetHeight, e.clientY - offsetY));
```



### 创建唯一ID方式

------

1. 自增计数器（最简单，适合单页内）

```js
// 模块级闭包，页面刷新后重新从 0 开始
const genId = (() => {
  let count = 0;
  return prefix => `${prefix || 'uid'}-${++count}`;
})();

const btn = document.createElement('button');
btn.id = genId('btn');          // "btn-1"
document.body.appendChild(btn);
```

------

1. 时间戳 + 随机数（适合短时内批量创建）

```js
const genId = (prefix = 'id') =>
  `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

const div = document.createElement('div');
div.id = genId('card');         // "card-lxgrn-6f3d2"
document.body.appendChild(div);
```

------

1. 全局计数器 + 时间戳（几乎 100% 唯一）

```js
const genId = (() => {
  let c = 0;
  return (p = 'auto') =>
    `${p}_${Date.now()}_${++c}_${Math.random().toString(36).slice(2, 6)}`;
})();

const input = document.createElement('input');
input.id = genId('input');
document.body.appendChild(input);
```



### `toString(36)`用法

`toString(36)` 是 Number 原型上的方法，作用：  **“把数字用 36 进制字符形式打印出来”**。

------------------------------------------------
1. **36 进制**

   数字 0–9（10 个） + 字母 a–z（26 个） → 共 36 个符号。  
   因此 36 是最大的“字母 + 数字”混合进制，再大就要引入标点符号了。
------------------------------------------------
2. **`toString()`语法**
```js
(num).toString([radix])   // radix ∈ 2 ~ 36，省略时默认 10
```
返回值：**字符串**  
若 radix 不在 2–36 范围，抛 `RangeError`。

------------------------------------------------
3. **时间戳压缩用法**

`toString(36)` 相对于“用英文字母当数字”把整数拼成更短的字符串，常用来生成紧凑、可读、URL 友好的随机 ID。

```js
Date.now().toString(36) + Math.random().toString(36).substr(2, 5)
```
1. 把时间戳变短：13 位数字 → 8–9 位字符串，省空间。  
2. 把 0–1 随机小数继续用 36 进制“压缩”并取 5 位，增加随机熵。  
3. 最终得到**短、可读、区分大小写、无特殊符号**的 ID，如  
   `ixc6uj9h3xk`（共 14 位左右），比原生 13 位时间戳 + 17 位随机数短得多。

4. ```js
   (35).toString(36)      // "z"   → 35 是 36 进制里最后一位
   (36).toString(36)      // "10"  → 进位
   (16796159).toString(36) // "zzzz"  4 位 36 进制全是 z
   Date.now()             // 1710166123456 （13 位毫秒时间戳）
   Date.now().toString(36) // "ixc6uj9"  长度立刻缩到 8–9 位
   ```

5. 注意：结果都是小写字母 + 数字，不会有大写。 且返回字符串，别当成数字用 `+` 运算，否则会先被转回 10 进制









### 客户端本地存储形式

**定义：**把数据以“键值对”的形式保存在用户自己的浏览器里，刷新页面、关闭标签甚至重启浏览器后仍能读取，从而实现“离线可用、状态恢复、减少请求”等目的。 

------------------------------------------------
1. **Cookie：经典“背包客”**

- 1980s 老协议，天生「随请求自动携带」；  
- 大小受限（4 KB）、域名/path 隔离；  
- 默认不可跨域，需 SameSite/Secure 防 CSRF；  
- 只能存字符串。

```javascript
// 存
document.cookie = 'uid=123; max-age=86400; path=/; SameSite=Strict';
// 读
console.log(document.cookie); // "uid=123; theme=dark"
// 删：把过期时间设成过去
document.cookie = 'uid=; expires=' + new Date(0).toUTCString();
```

适用场景  
- 服务端必须读取的登录态（sessionId、refreshToken）；  
- 多页面共享且<4 KB 的“标记位”（A/B 测试分组）。

------------------------------------------------
2. **localStorage：极简“永久仓库”**

- 同源策略，协议+主机+端口一致即可共享；  
- 容量 5 MB 左右；  
- 同步 API，阻塞主线程，勿存超大 JSON；  
- 只能存字符串，对象需 `JSON.stringify/parse`。

```javascript
// 存
localStorage.setItem('theme', 'dark');
localStorage.setItem('user', JSON.stringify({id:1,name:'Tom'}));

// 读
const theme = localStorage.getItem('theme');
const user  = JSON.parse(localStorage.getItem('user'));

// 删
localStorage.removeItem('theme');
localStorage.clear(); // 清掉当前源下所有键
```

监听变化（跨标签页通信）
```javascript
window.addEventListener('storage', e => {
  // 触发条件：同一域名下其它标签页修改 localStorage
  console.log(e.key, e.oldValue, e.newValue);
});
```

适用场景  
- 不会随请求发送、且需要长期留存的“偏好”数据：深色模式、国际化语言、在线草稿箱。

------------------------------------------------
3. **sessionStorage：会话级“便签”**

API 与 localStorage 完全一致，区别只是  
- 生命周期 = 页面会话；  
- 每个标签页独立，不可共享；  
- 刷新页面仍在，关闭标签即销毁。

适用场景  
- 单页面多步骤流程：注册分步表单、购物车（非持久化）；  
- 防止意外刷新丢失的中间状态。

------------------------------------------------
4. **IndexedDB：浏览器里的“NoSQL”**

- 异步、事务、索引、大文件二进制（Blob/ArrayBuffer）；  
- 容量弹性（浏览器会根据磁盘/配额自动协商，通常 ≥250 MB）；  
- 支持同域多库、多表、主键、游标、版本升级；  
- 原生 Promise 包裹较繁琐，可装 `idb`（Google 出品）或 Dexie.js。

最小可运行示例（原生 API）
```javascript
const open = indexedDB.open('AppDB', 1);

open.onupgradeneeded = e => {
  const db = e.target.result;
  if (!db.objectStoreNames.contains('users')) {
    db.createObjectStore('users', {keyPath: 'id'});
  }
};

open.onsuccess = e => {
  const db = e.target.result;

  // 增
  const tx = db.transaction('users', 'readwrite');
  tx.objectStore('users').add({id: 1, name: 'Tom'});

  // 查
  tx.objectStore('users').get(1).onsuccess = e =>
    console.log(e.target.result); // {id:1, name:'Tom'}
};
```

适用场景  
- 真正的“离线优先”：Gmail 离线邮件、Notion 离线笔记、抖音离线视频缓存；  
- 大文件本地缓存：PDF、图片、SQLite 导出包；  
- 数据量超 5 MB、需要索引/分页/事务。

------------------------------------------------
5. **能力对比速查表**
| 特性             | cookie    | localStorage | sessionStorage | IndexedDB          |
| ---------------- | --------- | ------------ | -------------- | ------------------ |
| 最大容量         | 4 KB      | 5 MB         | 5 MB           | 250 MB~∞           |
| 是否随 HTTP 发送 | ✔         | ✘            | ✘              | ✘                  |
| 跨标签页共享     | ✔ 同域    | ✔ 同域       | ✘ 仅限当前标签 | ✔ 同域             |
| 生命周期         | 手动/过期 | 永久         | 会话           | 手动               |
| 数据类型         | string    | string       | string         | *任意*（含二进制） |
| 同步/异步        | 同步      | 同步         | 同步           | 异步               |
| 索引/查询        | ✘         | ✘            | ✘              | ✔ 高级             |













### 错误解决：

------

#### `.offsetWidth` `.offsetHeight`无法获取到正确宽高

**原因：**

因为在打印 `cardDiv.offsetWidth` 和 `cardDiv.offsetHeight` 时，`cardDiv` 还没有被插入到 `document.body`，此时它**还未渲染**，宽高为 0。**（计算依据为布局时的元素宽高）**

只有当元素被添加到 DOM 并渲染后，浏览器才会计算其实际尺寸。

**解决：**

先 `document.body.appendChild(cardDiv)`，再读取 `offsetWidth` 和 `offsetHeight`。

```js
document.body.appendChild(cardDiv);
console.log(cardDiv.offsetWidth, cardDiv.offsetHeight);
```

------

#### 报错`HierarchyRequestError: Only one element on document allowed`

**原因：**当前页面里已经有 `<html>`（或 `<body>`、`<head>`）这类顶级节点，而又试图再往 `document` 上 `appendChild` 一次，于是浏览器直接报错**（浏览器只接受一个 `document.documentElement`）**

**解决：**

```js
document.appendChild(panel);   // 错误写法
document.body.appendChild(panel);  // 正确写法
```

------





## Html和Css相关

### `.classList`和`.className`对比

| 特性     | `.className`                                                 | `.classList`                          |
| -------- | ------------------------------------------------------------ | ------------------------------------- |
| **本质** | 字符串（`"foo bar baz"`）                                    | DOMTokenList 对象，带专用方法         |
| **读取** | 一次性拿到完整字符串，需要自行 `split(" ")` 才能得到数组     | 直接像数组一样读取：`el.classList[0]` |
| **写入** | 整体覆盖：`el.className = "foo bar"`，容易误删原有类         | 精准增删：`add/remove/toggle/replace` |
| **追加** | 手动拼串 & 判重：`if(!/foo/.test(cls)) el.className += " foo"` | `el.classList.add("foo")`，自动去重   |
| **删除** | 正则替换或 `replace` 字符串                                  | `el.classList.remove("foo")`          |
| **切换** | 自己写逻辑                                                   | `el.classList.toggle("foo")`          |
| **检查** | 正则或 `includes`                                            | `el.classList.contains("foo")`        |
| **性能** | 小项目无差异，大量类批量赋值时略快                           | 单次操作略慢，但可链式调用，易读      |

**注意：**  `.classList`得到的是 **DOMTokenList 对象**，不能直接运用数组方法，需要使用特定的方法进行增添修改



### 不可见方式对比

| 维度            | `display: none`                        | `visibility: hidden`                                         | `opacity: 0`                                                 |
| --------------- | -------------------------------------- | ------------------------------------------------------------ | ------------------------------------------------------------ |
| **是否占位**    | ❌ 彻底从文档流移除，**不占据任何空间** | ✅ 仍占原尺寸，**只是看不见**                                 | ✅ 同 `visibility`，**空间保留**                              |
| **是否可交互**  | ❌ 元素不在树上，无法点击、聚焦         | ❌ 不可交互，但能继承事件（极少场景）                         | ✅ 仍在树上，**仍可点击、聚焦**（需额外 `pointer-events: none` 才能屏蔽） |
| **过渡/动画**   | ❌ 不能过渡（瞬间消失/出现）            | ✅ `visibility` 可以配合 `transition` 做 **“淡入/淡出”**      | ✅ `opacity` 天生可过渡，**最常用淡入淡出**                   |
| **回流 & 重绘** | 触发 **回流**（Reflow）+ 重绘          | 仅 **重绘**（Repaint）                                       | 通常只触发 **合成层更新**（GPU），性能最好                   |
| **子元素**      | 整棵子树全部消失                       | 子元素默认也看不见；子元素可设 `visibility: visible` 再次显示（特殊技巧） | 子元素随父元素一起透明                                       |
| **典型用途**    | 完全移除：弹窗关闭、条件渲染、切换路由 | 占位隐藏：表格列/行切换、tab 懒加载占位                      | 动画：淡入淡出、悬浮遮罩、loading 动画                       |
| **屏幕阅读器**  | 不朗读                                 | 不朗读（同 `display: none`）                                 | 仍朗读（因为元素在树上）                                     |



### `.textContent`和`.innerText`对比

| 特性                                  | `.textContent`       | `.innerText`                          |
| ------------------------------------- | -------------------- | ------------------------------------- |
| 是否受 CSS 隐藏影响（`display:none`） | ❌ 不受影响，仍会获取 | ✅ 受影响，隐藏元素不获取              |
| 是否保留 `<script>`、`<style>` 内容   | ✅ 会获取             | ❌ 会忽略                              |
| 是否保留换行符（`\n`）                | ✅ 保留原始格式       | ✅ 会模拟渲染后的换行                  |
| 是否触发重排（reflow）                | ❌ 不会               | ✅ 会（因为要计算可见性）              |
| 性能                                  | ⚡ 更快               | 🐌 更慢                                |
| 兼容性                                | ✅ 所有现代浏览器     | ✅ 所有现代浏览器（IE 旧版支持差异大） |



### `data-*`自定义数据

`data-*` 是 HTML5 引入的一个**全局属性（global attribute）**，用于在 HTML 元素上**存储自定义数据**。这些数据不会被浏览器渲染，也不会影响页面行为，但可以被 JavaScript 或 CSS 访问，从而实现更灵活的交互和样式控制。

**基本语法**

```html
<div id="user" data-user-id="123" data-role="admin">张三</div>
```

- 属性名必须以 `data-` 开头。
- 属性值必须是字符串。
- 多个 `data-*` 属性可以共存。

------

**访问方式**

1. **JavaScript 访问**

​	1.使用 `dataset`（推荐）

```javascript
const userDiv = document.getElementById('user');

console.log(userDiv.dataset.userId); // "123"
console.log(userDiv.dataset.role);   // "admin"
```

> 注意：HTML 中的 `data-user-id` 对应 JS 中的 `dataset.userid`。

​	2.使用 `getAttribute`

```javascript
console.log(userDiv.getAttribute('data-user-id')); // "123"
```

2. **CSS 访问**

```css
div[data-role="admin"] {
  border: 2px solid red;
}
```





### 错误解决：

#### `transition` 动画过渡失效

**问题：**通过控制`display`属性来实现面板的开关（撑开父元素），但父元素的长宽过渡动画失效

**原因：**`transition` 只能对“数值可插值”的属性生效：

- 父元素： `width/height` 在子元素撑开/塌陷时变成了 `auto`，`auto → 具体值` 或 `具体值 → auto` 数值未知无法补帧
- 子元素：`display: none`是离散值，不能过渡（瞬间消失/出现）

**解决：**将长宽改为设定的已知值

**注意：**若有多者都需过渡需要将多者分开写：

```css
transition: width height 1.4s ease-in-out; //错误写法
transition: width 0.4s ease-in-out, height 0.4s ease-in-out; //正确写法
```

------

#### `transform-origin `不生效问题

**解决：**面板打开时没有使用 transform 变换，而是直接改变 width/height，所以 transform-origin 不会影响动画效果

------

#### `addEventListener`传参出错

**解决：**

```js
element.addEventListener('click', handleClick()); 
// 错误，这样会立即执行 handleClick，并把返回值（undefined）作为监听器
// 不需要在函数名后面加上括号
```

------











## 项目发布与部署












## 性能优化

### 动画优化

**改动：**
将 left/top 的定位方式替换为 transform，并在 CSS 中类添加 will-change: transform

**原因：**
- 使用 transform 替代 left/top：可以让浏览器只在合成层上移动元素，而不需要触发布局（reflow）和重绘（repaint），大幅减少计算量，动画更流畅。
- will-change: transform 告诉浏览器该属性会频繁变化，浏览器会提前为该元素分配独立的合成层，进一步避免不必要的重排和重绘，提升响应速度和动画性能。



### 合成层

**定义：**
合成层（Compositor Layer）是浏览器渲染管线里的一个独立画布，简单说：
浏览器把网页拆成若干层，每层单独画好，再像 PS 一样一次性合成到屏幕上。
只要这一层里的内容不改变，后续帧就直接复用这张小画布，只移动/缩放/淡入淡出这张画布，从而跳过重新绘制和布局。

**特点：**

1. **减少重绘区域**
   只重绘变化的那一层，其他层复用。
2. **GPU 加速**
   每层都可以上传到 GPU 作为纹理，变换（translate/scale/rotate/opacity）由 GPU 直接完成，CPU 不参与。
3. **60 fps 平滑动画**
   避免主线程阻塞，动画在合成线程独立进行。

------

**常见自动提升为合成层的情况：**

- 3D transform：`transform: translateZ(0)`、`rotateY(45deg)`
- 视频、Canvas、WebGL
- `position: fixed`、`sticky`
- `will-change: transform / opacity`
- `filter`、`backdrop-filter`
- `iframe`、`overflow: scroll`（部分浏览器）






------

**问题：**

**原因：**

**解决：**









```js
// bookmark.js

let addDiv = null;
let btnDiv = null;
let cardDiv = null;
let inputDiv = null;
const bookmarks = []; // 存储当前页面的书签对象

// 生成唯一标识符
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

// 获取当前页面标识符（使用 URL）
function getPageKey() {
  return window.location.origin + window.location.pathname;
}

// 创建书签元素
function createBookmarkElement(scrollTop, text, id) {
  const bookmarkDiv = document.createElement('div');
  bookmarkDiv.className = 'bookmark-marker';
  bookmarkDiv.style.top = `${(scrollTop / (document.documentElement.scrollHeight - window.innerHeight)) * 100}%`;
  bookmarkDiv.dataset.id = id;

  // 悬停弹窗
  const tooltip = document.createElement('div');
  tooltip.className = 'bookmark-tooltip';
  tooltip.textContent = text;

  const deleteBtn = document.createElement('span');
  deleteBtn.className = 'bookmark-delete';
  deleteBtn.innerHTML = '&times;';
  deleteBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    removeBookmark(id, bookmarkDiv);
  });

  tooltip.appendChild(deleteBtn);
  bookmarkDiv.appendChild(tooltip);

  // 点击跳转
  bookmarkDiv.addEventListener('click', () => {
    window.scrollTo({ top: scrollTop, behavior: 'smooth' });
  });

  return bookmarkDiv;
}

// 保存书签到 storage
function saveBookmark(scrollTop, text) {
  const id = generateId();
  const pageKey = getPageKey();

  chrome.storage.local.get({ bookmarks: {} }, (result) => {
    const bookmarks = result.bookmarks;
    if (!bookmarks[pageKey]) bookmarks[pageKey] = [];

    bookmarks[pageKey].push({ id, scrollTop, text });
    chrome.storage.local.set({ bookmarks });

    // 创建并插入 DOM 元素
    const scrollDiv = document.querySelector('.scroll-percent');
    const fillDiv = scrollDiv.querySelector('.scroll-fill');
    const bookmarkEl = createBookmarkElement(scrollTop, text, id);
    scrollDiv.insertBefore(bookmarkEl, fillDiv.nextSibling);
  });
}

// 删除书签
function removeBookmark(id, element) {
  const pageKey = getPageKey();

  chrome.storage.local.get({ bookmarks: {} }, (result) => {
    const bookmarks = result.bookmarks;
    if (bookmarks[pageKey]) {
      bookmarks[pageKey] = bookmarks[pageKey].filter(b => b.id !== id);
      chrome.storage.local.set({ bookmarks });
    }
    element.remove();
  });
}

// 加载书签
export function loadBookmarks() {
  const pageKey = getPageKey();
  chrome.storage.local.get({ bookmarks: {} }, (result) => {
    const bookmarks = result.bookmarks[pageKey] || [];
    const scrollDiv = document.querySelector('.scroll-percent');
    const fillDiv = scrollDiv.querySelector('.scroll-fill');

    bookmarks.forEach(b => {
      const bookmarkEl = createBookmarkElement(b.scrollTop, b.text, b.id);
      scrollDiv.insertBefore(bookmarkEl, fillDiv.nextSibling);
    });
  });
}

// 添加书签按钮点击事件
function createBookmark() {
  const val = inputDiv.value.trim();
  if (!val) return;
  const scrollTop = window.scrollY;
  saveBookmark(scrollTop, val);
  inputDiv.value = '';
}

export function activateBookmark() {
  addDiv = document.createElement('div');
  addDiv.className = 'add-bookmark';

  inputDiv = document.createElement('input');
  inputDiv.type = 'text';
  inputDiv.placeholder = '添加书签备注';
  inputDiv.className = 'bookmark-input';
  addDiv.appendChild(inputDiv);

  btnDiv = document.createElement('button');
  btnDiv.className = 'bookmark-button';
  btnDiv.textContent = '添加书签';
  btnDiv.addEventListener('click', createBookmark);
  addDiv.appendChild(btnDiv);

  cardDiv = document.getElementsByClassName('card-content')[0];
  if (cardDiv) cardDiv.appendChild(addDiv);

  loadBookmarks(); // 页面加载时恢复书签
}

```





```
  const scrollTop   = window.scrollY;
  const docHeight   = document.documentElement.scrollHeight;
  const winHeight   = window.innerHeight;
  const progressPct = (scrollTop / (docHeight - winHeight)) * 100;
  const percent = Math.round(progressPct);
```





```
// 生成唯一id标识符
function getId(){
  let date=Date.now().toString(36);
  let random=Math.random().toString(36).slice(0,3);
  return date+random;
}

//用页面URL来作为切换页面时的key
function getPageId(){
  return window.location.origin+window.location.pathname;
}
```

