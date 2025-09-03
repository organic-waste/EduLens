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

**原因：**使用transform来追踪鼠标位置，只设置了`position:fixed;`，没有设置`top/left`值，导致元素跟随文档流生成在网站最底部

**解决：**

```js
//记得写明初始top和left值，否则fixed定位错乱
  highlightDiv.style.left = 0+ 'px';
  highlightDiv.style.top = 0 + 'px';
```



### 获取元素的位置方法

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





### 错误解决：

------

#### `.offsetWidth` `.offsetHeight`无法获取到正确宽高

因为在打印 `cardDiv.offsetWidth` 和 `cardDiv.offsetHeight` 时，`cardDiv` 还没有被插入到 `document.body`，此时它**还未渲染**，宽高为 0。**（计算依据为布局时的元素宽高）**

只有当元素被添加到 DOM 并渲染后，浏览器才会计算其实际尺寸。
正确做法是：先 `document.body.appendChild(cardDiv)`，再读取 `offsetWidth` 和 `offsetHeight`。

```js
//正解
document.body.appendChild(cardDiv);
console.log(cardDiv.offsetWidth, cardDiv.offsetHeight);
```

------









## 项目发布与部署












## 性能优化

### 动画优化

------

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