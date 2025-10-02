[TOC]

# EduLens—项目心得

## 代办：

#### 文字黄色高亮强调效果

#### 上传和截取图像放在页面上

#### 添加文本text

#### 滚动截取长屏

#### 为涂鸦和矩形注释添加 rAF

#### 解决过多事件监听的问题

参考：[一支华子时间，来开发一个 Chrom 截图任意区域或DOM的插件，Chrome 扩展程序开发快速上手(超详细)_chrome截图插件-CSDN博客](https://blog.csdn.net/weixin_44787578/article/details/139107217)

#### 样式响应性

#### 自定义个性化面板

- 截图保存格式，分辨率
- 截图粘贴时是base64还是图片
- 截图后文件保存路径



- 面板主题颜色



- 删除对应网站的localstorage中的数据





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



### "permissions"权限配置

| 权限字符串                                                | 作用一句话                                                   | 备注                                         |
| --------------------------------------------------------- | ------------------------------------------------------------ | -------------------------------------------- |
| `activeTab`                                               | 临时访问当前活动标签页（注入脚本、获取 url/title/favIconUrl） | 无需 host，用户点击/命令触发才生效           |
| `scripting`                                               | 动态向页面注入 JS/CSS（`chrome.scripting.executeScript/insertCSS`） | MV3 新增，替代旧 `tabs.executeScript`        |
| `tabs`                                                    | 查询/创建/更新/关闭任意标签页（`chrome.tabs.*`）             | 仍需配合 host_permissions 才能读敏感字段     |
| `contextMenus`                                            | 创建右键菜单（`chrome.contextMenus.create`）                 |                                              |
| `cookies`                                                 | 读写 cookie（`chrome.cookies.*`）                            | 必须再声明对应 host_permissions              |
| `history`                                                 | 读写浏览历史（`chrome.history.*`）                           |                                              |
| `bookmarks`                                               | 读写书签（`chrome.bookmarks.*`）                             |                                              |
| `downloads`                                               | 管理下载（`chrome.downloads.*`）                             |                                              |
| `notifications`                                           | 发出系统级通知（`chrome.notifications.*`）                   |                                              |
| `clipboardWrite` / `clipboardRead`                        | 写入/读取剪贴板                                              |                                              |
| `alarms`                                                  | 创建定时闹钟（`chrome.alarms.*`）                            | ServiceWorker 被干掉后也能唤醒               |
| `unlimitedStorage`                                        | 移除 local/storage.local 的 10 MB 上限                       | 仅对 `chrome.storage.local` 与扩展包体积生效 |
| `nativeMessaging`                                         | 与本地二进制进程通信                                         | 需额外配置原生清单文件                       |
| `topSites`                                                | 读取用户“最常访问”的新标签页站点                             |                                              |
| `system.cpu / system.memory / system.storage`             | 读取 CPU/内存/存储信息                                       |                                              |
| `processes`                                               | 访问 chrome:processes 页面信息                               |                                              |
| `proxy`                                                   | 设置 PAC 代理                                                |                                              |
| `vpnProvider`                                             | 实现 VPN 扩展                                                |                                              |
| `declarativeNetRequest` / `declarativeNetRequestFeedback` | 拦截/修改请求，替代 MV2 的 webRequest                        |                                              |
| `webNavigation`                                           | 监听页面导航事件（`chrome.webNavigation.*`）                 |                                              |



### 调试方法

------

**内容脚本调试**

1. 打开目标网页

2. 按 F12 打开开发者工具

3. 在 Console 中测试

```js
chrome.runtime.sendMessage({action: 'toggleFeature', feature: 'highlight'})
```

------

**Popup 调试**

1. 点击插件图标打开 popup

2. 右键 popup 窗口选择"检查"

------

**Background 调试**

1. 打开 chrome://extensions/

2. 找到插件，点击"检查视图"中的 Service Worker 

------

**`chrome.storage`调试**

1. **Chrome 内置面板 → “应用”→“存储”→“扩展存储”**

步骤：  
1. 打开**开发者工具**（F12）  
2. 顶部切到 **Application（应用）** 面板  
3. 左侧树依次展开  
   **Storage → Extension Storage → chrome-extension://<你的扩展ID>**  
4. 右侧会出现一个**表格视图**  
   - Key 列 = 你存的键  
   - Value 列 = 自动反序列化后的 JSON（可折叠）  

> 如果没看到“Extension Storage”，说明当前页面不是扩展上下文（content/popup/background）。  
> 解决：  
> - 打开扩展的 **popup** 再按 F12  
> - 或者进入 `chrome://extensions` → 打开**“背景页”/“Service Worker”** → 在弹出的 DevTools 里按上面步骤查看

2. **/snippets 面板手写一行命令（调试任何上下文）**

在 DevTools → **Sources → Snippets** 新建 snippet，粘贴并运行：

```javascript
// 查看 local 区全部内容
chrome.storage.local.get(null, console.log);

// 查看 sync 区
chrome.storage.sync.get(null, console.log);
```
运行后结果会直接出现在 **Console** 里，展开即可。





### 前后端通信原理

------

**架构概述**

浏览器插件采用分层架构：
- **Background Script**：后端，常驻内存，管理全局状态
- **Content Script**：前端，注入到每个页面中，与页面DOM交互
- **Popup**：弹出窗口，用户界面
- **Options Page**：设置页面

------

**通信方式分类**

1. **单向通信（发送消息）**

```javascript
// 发送方 → 接收方
chrome.runtime.sendMessage({
  type: 'MESSAGE_TYPE',
  data: { key: 'value' }
});

// Popup/Options → Background
chrome.runtime.sendMessage({ type: 'GET_DATA' });

// Content Script → Background
chrome.runtime.sendMessage({ type: 'PAGE_LOADED' });
```

2. **双向通信（发送并等待响应）**

```javascript
// 发送请求并等待响应
chrome.runtime.sendMessage(
  { type: 'GET_USER_DATA' },
  (response) => {
    console.log('收到响应:', response);
  }
);

// Background 返回响应
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'GET_USER_DATA') {
    sendResponse({ user: 'John', age: 30 }); // 同步响应
    return true; // 保持通道开放用于异步响应
  }
});
```

3. **长连接通信（Port）**

```javascript
// 建立长连接
const port = chrome.runtime.connect({ name: 'data-channel' });

// 发送消息
port.postMessage({ type: 'DATA_UPDATE', data: payload });

// 接收消息
port.onMessage.addListener((msg) => {
  console.log('收到消息:', msg);
});

// 断开连接
port.disconnect();
```

------

**通信规则和最佳实践**

1. **消息结构规范**

```javascript
// 标准消息格式
const message = {
  type: 'ACTION_TYPE',      // 必填：消息类型
  data: { /* 数据 */ },     // 可选：负载数据
  timestamp: Date.now(),    // 可选：时间戳
  source: 'content-script'  // 可选：消息来源
};
```

2. **错误处理**

```javascript
// 添加超时机制
function sendMessageWithTimeout(message, timeout = 5000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error('Message timeout'));
    }, timeout);

    chrome.runtime.sendMessage(message, (response) => {
      clearTimeout(timer);
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve(response);
      }
    });
  });
}
```

3. **安全性规则**

```javascript
// 验证消息来源
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // 检查发送方是否是插件本身
  if (sender.id !== chrome.runtime.id) {
    sendResponse({ error: 'Unauthorized' });
    return;
  }
  
  // 检查必要的消息字段
  if (!message.type) {
    sendResponse({ error: 'Missing message type' });
    return;
  }
});
```

4. **性能优化**

```javascript
// 批量处理消息
let messageQueue = [];
let processing = false;

async function processQueue() {
  if (processing) return;
  processing = true;
  
  while (messageQueue.length > 0) {
    const message = messageQueue.shift();
    await handleMessage(message);
  }
  
  processing = false;
}

// 节流高频消息
function throttleMessage(type, data, delay = 100) {
  if (!this.throttleTimers) this.throttleTimers = {};
  
  clearTimeout(this.throttleTimers[type]);
  this.throttleTimers[type] = setTimeout(() => {
    chrome.runtime.sendMessage({ type, data });
  }, delay);
}
```



### `chrome.tabs`和`chrome.runtime`对比

------

**定义：**

- `chrome.tabs.sendMessage` 是“定向投递”，只往**某个具体标签页里的 content-script**发消息；第一个参数 `activeInfo.tabId` 就是“收件人地址”——告诉浏览器“把这封信投进哪个标签页”。  
- `chrome.runtime.sendMessage` 是“广播”，只能发到**扩展自身上下文**（background/popup/devtools 等），**到不了页面**。  

**示例：**

- background ↔ popup：用 `runtime`  
- background ↔ 某个页面：用 `tabs`（必须带 tabId）



### `"commands"`  快捷键注册

------

在 Chrome 扩展里，`manifest.json` 中的 `"commands"` 字段用来把**键盘快捷键**注册到浏览器内核。  
只要用户按下你指定的组合键，浏览器就会在**任何网页、任何时刻**（只要扩展已启用）把一次 `chrome.commands.onCommand` 事件派发给扩展的 **background/service-worker** 脚本，从而实现“全局热键”功能。  

------------------------------------------------
**一、最小可运行示例（MV3）**

```json
  "commands": {
    "take-screenshot": {               // 自定义命令名，可随意取
      "suggested_key": {
        "default": "Ctrl+Shift+S",     // 默认组合键
        "mac": "Command+Shift+S"       // macOS 专用
      },
      "description": "截取当前标签页"   // 在 chrome://extensions/shortcuts 里展示
    },
    "_execute_action": {               // 保留关键字：点击扩展图标
      "suggested_key": {
        "default": "Ctrl+Shift+Y"
      }
    }
  }
```

------------------------------------------------
**二、字段结构详解**

```ts
"commands": {
  "<commandId>": {              // 命令 ID，字符串，自定义
    "suggested_key": {          // 建议键位，非强制
      "default": "Ctrl+Shift+1",// Windows / Linux / mac 通用
      "windows": "Ctrl+Shift+2",
      "mac": "Command+Shift+2",
      "chromeos": "Ctrl+Shift+3",
      "linux": "Ctrl+Shift+4"
    },
    "description": "提示文字",   // 给用户看，可选
    "global": false             // 是否全局级（见下方第 5 点）
  },
  "_execute_action": { ... },   // MV3 专用，相当于旧版 browser_action
}
```

------------------------------------------------
**三、如何在代码里监听**

```js
// sw.js (MV3) 或 background.js (MV2)
chrome.commands.onCommand.addListener((commandId) => {
  if (commandId === 'take-screenshot') {
    chrome.tabs.captureVisibleTab(null, {format: 'png'}, (dataUrl) => {
      // 保存或上传截图
    });
  }
});
```

------------------------------------------------
**四、键位规则与限制**

1. 必须包含 `Ctrl` 或 `Alt`（Mac 可用 `Command`）；  
   不允许单独 `Shift+Letter`。  
   合法示例：`Ctrl+Shift+Z`, `Alt+Shift+1`, `Command+Period`。  
2. 部分按键被浏览器占用（如 `Ctrl+T`、`Ctrl+W`），无法注册。  
3. 冲突时浏览器会让用户手动重新映射，**`suggested_key` 只是“建议”**。  
4. 最多注册 4 个自定义命令（含 `_execute_action`）。  
5. `"global": true` 表示**系统级全局热键**，即 Chrome 最小化时也能响应；  
   但需要额外权限 `"commands"` 且会被 Chrome 商店人工审核，**普通扩展别用**。

------------------------------------------------
**五、用户如何修改键位**

地址栏输入：  
`chrome://extensions/shortcuts`  
即可看到所有扩展注册的命令，支持自定义重新绑定。

------------------------------------------------
**六、常见问答**

1. content-script 能直接监听吗？  
   不能。命令事件只派发到 background/service-worker，需要再 postMessage 到内容脚本。  
2. 可以运行时动态注册吗？  
   不可以。快捷键必须在 manifest.json 静态声明，API 没有新增命令的接口。  
3. 为什么我的快捷键没反应？  
   - 检查是否与其他扩展冲突；  
   - 检查是否使用了被浏览器保留的键位；  
   - 打开 `chrome://extensions/shortcuts` 看是否显示“未设置”；  
   - 确认 background/service-worker 没有崩溃



### `"commands"` 和监听`keydown`事件对比

------

> `commands` 是浏览器官方给的“**扩展级全局快捷键通道**”，稳、后台可用、用户可配置；  
> `keydown` 只是普通 DOM 事件，**离开页面就失效**，适合页面临时交互，不适合“功能级”热键。

| 维度              | manifest.commands                                            | content-script keydown                                       |
| ----------------- | ------------------------------------------------------------ | ------------------------------------------------------------ |
| 1. 监听位置       | 浏览器内核 → 只派发给 **background/service-worker**          | 注入到每个页面的 **window** 对象                             |
| 2. 是否依赖页面   | ❌ 不依赖，空标签页、chrome://、PDF、DevTools 都能响应        | ✅ 依赖，页面必须实际加载且脚本注入成功                       |
| 3. 能否在后台触发 | ✅ 可以（只要浏览器本身还在）                                 | ❌ 页面被卸载、后台挂起、或 Chrome 最小化就收不到             |
| 4. 冲突解决       | 浏览器统一做冲突检测，用户可在 `chrome://extensions/shortcuts` 重新映射 | 无机制，多个扩展或网页自己监听同一按键就**互相覆盖**         |
| 5. 可用键位限制   | 只能用 **Ctrl/Alt/⌘ + 字母/数字/功能键**；部分系统组合被屏蔽 | 理论上**任意键**都能听，包括单字母、F1-F24、多媒体键         |
| 6. 权限/审核      | 仅需 `"commands"` 权限，无额外警告；设 `"global":true` 才人工审核 | 需要 `"content_scripts"` 权限，**每个网页都会提示“读取和更改网站数据”** |
| 7. 代码写法       | 后台添加`chrome.commands.onCommand.addListener(...)`         | `addEventListener('keydown', ...)`，还要过滤组合键、防抖、区分输入框 |
| 8. 生命周期       | 跟随扩展，**一直有效**                                       | 跟随页面，**刷新、跳转、SPA 路由切换**都要重新注入           |

**场景对照：**

- 想做一个“一键截图 / 一键静音 / 一键翻译当前标签”的全局热键 → 用 `commands`  
- 只想在当前页面内按 `Q` 切换高光、按 `W` 画矩形 → 用 `content-script keydown` 就够了，简单直接



### `chrome.storage.sync`  云储存

------

`chrome.storage.sync` 是 Chrome 扩展提供的 “云同步”存储通道，把数据**自动同步**到登录了同一 Google 账号的所有设备。  
与 `local` 相比，它更适合保存 用户偏好、轻量配置，而不是大文件或敏感数据。

| 类型                   | 存储位置             | 容量上限         | 是否跨设备同步 | 典型用途                     |
| ---------------------- | -------------------- | ---------------- | -------------- | ---------------------------- |
| `chrome.storage.local` | 本地磁盘             | ≈ 5 MiB / 扩展   | ❌              | 大体积缓存、临时数据         |
| `chrome.storage.sync`  | 本地 + Google 服务器 | ≈ 100 KiB / 扩展 | ✅              | 主题、开关、快捷键等用户设置 |

---

**常用 API（返回 Promise，可 await）**

```javascript
// 写
await chrome.storage.sync.set({ key: value });
// 读（缺省值写法）
const { key } = await chrome.storage.sync.get({ key: 'default' });
// 删除
await chrome.storage.sync.remove('key');
// 清空
await chrome.storage.sync.clear();
```

---

**注意事项**

1. **100 KiB 硬顶**：超出会抛 `QUOTA_BYTES_PER_ITEM` 错误。  
2. **离线可用**：断网时先写本地，网络恢复后自动合并。  
3. **非端到端加密**：Google 服务器上存储，不要放密码、Token。  
4. **同步频率限制**：短时间内大量写会被节流（建议批量 `set({...})`）。  
5. **无痕模式**下同样可用，但无痕窗口退出后本地副本会被清除。
6. **chrome://sync-internals** 可查看同步日志，排查同步延迟。



### `chrome.notifications`和原生弹窗对比

------

| 维度         | chrome.notifications                                         | 浏览器原生弹窗 (alert/confirm/prompt)            |
| ------------ | ------------------------------------------------------------ | ------------------------------------------------ |
| **显示位置** | 操作系统级通知区域（Windows 右下角、macOS 右上角），**浏览器最小化也能看见** | 当前标签页正中央，**必须保持在当前页面**         |
| **运行线程** | 后台脚本/Service Worker 里就能调用，**无需打开任何页面**     | 只能在**前台页面线程**执行，后台脚本无法直接使用 |
| **阻塞行为** | 完全**异步**，不阻塞代码执行                                 | **同步阻塞**，不点按钮代码就不会往下走           |
| **样式控制** | 系统统一 UI，不能改字体、颜色、大小；可带图标、按钮、进度条  | 浏览器原生皮肤，无法自定义样式                   |
| **交互能力** | 可添加**1~3 个按钮**、可监听点击/关闭事件；用户不点也会自动消失 | 只能点“确定/取消”，**无法增加额外按钮**          |
| **权限要求** | 扩展声明 `"notifications"` 权限即可，无需用户额外授权        | 无需权限，随时可用                               |
| **使用场景** | 扩展后台定时提醒、下载完成、截图成功等“后台→用户”通知        | 调试或强制确认，“页面→用户”即时阻塞              |

-------------------------------------------------
**`chrome.notifications` 代码示例（MV3 background.js）**

```javascript
chrome.notifications.create({
  type:     'basic',
  iconUrl:  'icon.png',
  title:    '截图完成',
  message:  '已保存到下载文件夹',
  buttons:  [{title: '打开'}, {title: '分享'}]
});
```
**浏览器原生弹窗代码示例（任意页面脚本）**

```javascript
// 阻塞式，点确定前页面卡死
const ok = confirm('确定删除该文件？');
if (ok) console.log('用户点了确定');
```



### Chrome 扩展国际化（i18n）

------

Chrome 扩展的国际化（i18n）机制让你只用“一份代码”就能**根据不同语言环境自动切换界面文字**。核心思路是：

1. 把用户能看见的所有文字抽出来，放进语言包；
2. 在代码里不再写死中文或英文，而是用“占位符”或 API 去语言包里取；
3. 浏览器会根据用户系统语言自动加载对应语言包，找不到时就回退到默认语言。

下面按“目录结构 → 语言包格式 → 三种使用场景 → 调试与回退”四步完整介绍。

------------------------------------------------
**一、目录结构（必须这样命名）**

```powershell
_locales/               ← 下划线开头，固定名字
├─ en/                  ← 语言代码，可用 zh_CN、zh_TW、es、ko 等
│  └─ messages.json     ← 固定文件名
├─ zh_CN/
│  └─ messages.json
└─ zh_TW/
   └─ messages.json
```

**“注意”**：一旦扩展里出现 _locales 目录，manifest.json **必须** 声明 default_locale，否则 Chrome 直接报无效扩展 

------------------------------------------------
**二、语言包格式（messages.json）**
每个文件都是一个扁平的 JSON，键名随意，但建议用 snakeCase（小写带下划线）：

```json
/* _locales/en/messages.json */
{
  "ext_name": {
    "message": "Web Screenshot",
    "description": "扩展名称，显示在商店与工具栏提示"
  },
  ......
}
```

- message 必填：真正要被显示的字符串。
- description 可选：给翻译人员看，Chrome 本身不用。

```json
{ 
    "test": {
        "message": "你好$name$",
        "description": "占位符测试",
        "placeholders": {
            "name": {
                    "content": "$1",
                    "example": "刘华强" //example 只是一个案例示范，同description仅提示
            }
        }
    }
}
```

```js
const text = chrome.i18n.getMessage("test", "小明");
console.log('text', text)  
//打印 “text 你好小明”
```

- 支持 \$1~\$9 占位符与 @@bidi_dir 等预定义变量，可做复数与方向适配 。

------------------------------------------------
**三、三种使用场景**

1. **manifest.json / CSS 中——写占位符  \__MSG\_\<key\>\_\_ **  
   用 \__MSG\_\<key\>\_\_ 语法，浏览器在加载扩展时自动替换，**零代码** ：

   ```json
   {
     "name": "__MSG_ext_name__",
     "description": "__MSG_ext_desc__",
     "default_locale": "en",
     "action": {
       "default_title": "__MSG_capture_btn__"
     }
   }
   ```
   
2. **HTML 中——用 inline 脚本取值**  
   HTML 本身不被 Chrome 预解析，只能在页面里用 js 写入：

   ```html
   <!DOCTYPE html>
   <html>
   <head>
     <meta charset="utf-8">
     <title data-i18n="ext_name"></title>
   </head>
   <body>
     <button id="capture"></button>
     <script>
       // 一次性把带 data-i18n 属性的元素填掉
       document.querySelectorAll('[data-i18n]').forEach(el => {
         const key = el.dataset.i18n;
         el.textContent = chrome.i18n.getMessage(key);
       });
       // 按钮额外再设一次
       document.getElementById('capture').textContent =
         chrome.i18n.getMessage('capture_btn');
     </script>
   </body>
   </html>
   ```
   
3. **JavaScript/Content Script/Service Worker——运行时动态取**  
   任意时刻都可调用 chrome.i18n.getMessage：

   ```js
   const title = chrome.i18n.getMessage('ext_name');   // Web Screenshot
   const tip   = chrome.i18n.getMessage('capture_btn'); // Capture
   ```

   也支持带参数的模板：
   
   ```json
   /* messages.json */
   "stats": { "message": "Captured $1 pages in $2 seconds" }
   ```
   
   ```js
   /* popup.js */
   const msg = chrome.i18n.getMessage('stats', [7, 3]); // Captured 7 pages in 3 seconds
   ```

------------------------------------------------
**四、语言匹配与调试技巧**

1. 匹配顺序  
   Chrome 会拿用户浏览器“Accept-Language”列表依次去 _locales 里找，找到即停止；都没有就回落到 default_locale 。

2. 快速验证  
   - 打开 chrome://extensions，右上角“开发者模式”→“加载已解压的扩展”，选中根目录即可。  
   - 改浏览器界面语言：chrome://settings/languages → 把目标语言移到最顶部，重启浏览器即可看到效果。  
   - 控制台直接执行 chrome.i18n.getMessage('xxx') 可即时测试。

3. 常见坑  
   - 忘记写 default_locale → 扩展直接被拒/报错。  
   - 语言代码大小写错（zh-cn vs zh_CN）→ Chrome 忽略该目录。  
   - JSON 里多了逗号 → 加载失败，控制台有明确的 JSON parse 报错。  
   - 在 content_script 里用 getMessage 没问题，但在普通网页里不能调用（API 只对扩展上下文暴露）。





### 错误解决：

#### 加载扩展时scss文件报错

------

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



#### 提交项目时github连接失败

------

**原因：**
使用clash代理导致github代理出错

**解决：**

```
git config --global http.proxy  http://127.0.0.1:7890
git config --global https.proxy http://127.0.0.1:7890
```



#### 打包后路径依赖问题

------

**问题：**
`Failed to fetch dynamically imported module: chrome-extension://apkjdjeifklnkjdoadlkpbpfcnfgkanf/content-scripts/main.js`


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



#### Popup窗口闪烁问题

------

**原因：**

- crxjs 在开发模式下会自动生成一个 loading 页面，等待 Vite Dev Server 连接。如果 Vite 没有正常启动或 popup 入口配置不对，就会一直显示这个页面。
- Vite 的 client 脚本（如热重载、错误覆盖层）在 Chrome 扩展环境下经常不兼容，容易报错。

**解决：**
直接访问 Vite Dev Server 的 popup 页面（ http://localhost:5173/src/popup/index.html）



#### Css文件打包后不存在或出错

------

**原因：**
在 vite.config.js 的 rollupOptions.input 中加入了 styles: 'public/style.css'，导致 Vite/rollup 试图将 style.css 作为 JS/HTML 入口处理，所以报错

**解决：**

- 不要在 rollupOptions.input 里加入 CSS 文件入口，只保留 JS/HTML 入口即可。
- 将css移动到public文件夹，并manifest.json 里 css 路径设置为 "style.css"（ style.css 构建后会自动复制到 dist 根目录）。



#### `chrome.storage`传递参数出错

------

**原因：**`chrome.storage.local.get()` 期望接收一个键名或键名数组作为参数，而不是一个值

**解决：**

```js
// 错误用法 - bookmarks 是未定义的变量
let bookmarks = await chrome.storage.local.get(bookmarks);

// 正确用法：
// 方式1：获取特定键
let result = await chrome.storage.local.get('bookmarks');
let bookmarks = result.bookmarks || {};

// 方式2：使用默认值
let result = await chrome.storage.local.get({bookmarks: {}});
let bookmarks = result.bookmarks;
```



#### 无法监测到SPA页面的路由跳转

------

**原因：**SPA 换页 = 浏览器地址栏变 → 不重新加载文档 → 不走网络 → `chrome.tabs.onActivated`，`chrome.tabs.onUpdated`，`chrome.webNavigation.onCommitted`等方法都不能监测到路由改变。

页面里实际发生的是：`history.pushState/replaceState` 或 `location.hash = 'xxx'`

**解决：**

**方法一：重写History API（最可靠）**

```js
// 监听SPA的pushState和replaceState
function monitorSPANavigation() {
  // 保存原始方法
  const originalPushState = history.pushState;
  const originalReplaceState = history.replaceState;

  // 重写pushState
  history.pushState = function (...args) {
    originalPushState.apply(this, args);
    handleRouteChange('pushState');
  };

  // 重写replaceState
  history.replaceState = function (...args) {
    originalReplaceState.apply(this, args);
    handleRouteChange('replaceState');
  };

  // 监听popstate事件（浏览器前进后退）
  window.addEventListener('popstate', () => {
    handleRouteChange('popstate');
  });

  // 监听hashchange（如果SPA使用hash路由）
  window.addEventListener('hashchange', () => {
    handleRouteChange('hashchange');
  });
}

function handleRouteChange(source) {
  console.log('路由改变 detected from:', source);
  console.log('新URL:', window.location.href);
  
  // 在这里调用你的书签加载逻辑
  loadBookmarks();
}
```

------

**方法二：MutationObserver监听DOM变化**

```js
function monitorDOMForSPA() {
  let lastURL = window.location.href;
  
  const observer = new MutationObserver((mutations) => {
    const currentURL = window.location.href;
    
    if (currentURL !== lastURL) {
      lastURL = currentURL;
      console.log('URL变化:', currentURL);
      loadBookmarks();
    }
  });

  // 监听整个document的变化
  observer.observe(document, {
    subtree: true,
    childList: true,
  });
}
```



#### `chrome.storage.session` 权限不够

------

**问题：**`278 Error: Access to storage is not allowed from this context.`

**原因：**`chrome.storage.session` 的可用上下文：

- Service Worker（后台脚本）
- 扩展的弹出窗口（popup）
- 扩展的选项页（options page）

不包含内容脚本（content script）

**解决：**通过 Background 中转或者改为`chrome.storage.local` 。



#### Font Awesome 图标加载失败

> content-script 的 JS 运行在 **隔离上下文**，  
> 它**不会自动继承页面已经加载的 Font Awesome CSS**，  
> 所以你**必须自己把 Font Awesome 的 CSS 注入到页面 DOM**，否则图标显示成方框或空白。

---

**最小改动方案（动态注入 CDN）**

把下面这段代码 **插到你的 content-script 顶部**（只执行一次即可）：

```js
// 1. 注入 Font Awesome 6 免费 CSS
if (!document.querySelector('#fa-content-script')) {
  const fa = document.createElement('link');
  fa.id = 'fa-content-script'; //加 `id` 是为了避免重复注入
  fa.rel = 'stylesheet';
  fa.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css';
  (document.head || document.documentElement).appendChild(fa);
}
```

---

**本地扩展包方案（无 CDN，离线可用）**

可以把 `all.min.css` 下载到扩展本地，用 `chrome.runtime.getURL` 引入

1. 把 [font-awesome zip](https://fontawesome.com/download) 解压后  
   放进扩展目录，比如  
   
   ```
   extension/
     ├─ assets/
     │   └─ fontawesome/
     │       ├─ css/all.min.css
     │       └─ webfonts/*
     ├─ manifest.json
     └─ src/...
   ```
   
2. 在 `manifest.json` 里声明 **Web 可访问资源**：

```json
"web_accessible_resources": [
  {
    "resources": ["assets/fontawesome/css/all.min.css"],
    "matches": ["<all_urls>"]
  }
]
```

3. 在 content-script 里注入：

```js
const link = document.createElement('link');
link.rel = 'stylesheet';
link.href = chrome.runtime.getURL('assets/fontawesome/css/all.min.css');
(document.head || document.documentElement).appendChild(link);
```



#### 后台截图返回数据为`null`

------

**问题：**`Unchecked runtime.lastError: Either the '<all_urls>' or 'activeTab' permission is required.`

**解决：**确保`manifest.js`权限足够

```json
{
  "permissions": [
    "activeTab",
    "tabs"
  ],
  // 如果需要访问所有网站，也需要添加：
  "host_permissions": [
    "<all_urls>"
  ]
}
```




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



### `chrome.storage`  Chrome 扩展本地存储

------------------------------------------------
1. **核心概念与存储分区**

`chrome.storage` 一共分为 4 个“桶”（StorageArea），每个桶的可见性、生命周期、配额都不同：

| 分区            | 数据存放位置 | 生命周期                  | 默认配额                       | 是否同步到账号     | 参与上下文                        |
| --------------- | ------------ | ------------------------- | ------------------------------ | ------------------ | --------------------------------- |
| storage.local   | 本地磁盘     | 卸载扩展即清空            | 10 MB（可申 unlimitedStorage） | ×                  | background、popup、content_script |
| storage.sync    | 先本地再上传 | 卸载扩展即清空            | ≈ 100 KB（单条 8 KB）          | √（需登录 Chrome） | 同上                              |
| storage.session | 内存         | 扩展重载/浏览器退出即清空 | 10 MB                          | ×                  | 主要用于 ServiceWorker            |
| storage.managed | 企业策略     | 只读                      | 不限                           | ×                  | 管理员预配                        |

------------------------------------------------
2. **快速上手**

步骤 1：在 `manifest.json` 声明权限  
```json
"permissions": ["storage"]
```

步骤 2：读写代码（Promise 风格）  
```javascript
// 写
await chrome.storage.local.set({uiLang: 'zh-CN', theme: 'dark'});

// 读
const {uiLang, theme} = await chrome.storage.local.get(['uiLang', 'theme']);
console.log(uiLang, theme);          // zh-CN dark

// 删
await chrome.storage.local.remove('theme');

// 清空
await chrome.storage.local.clear();
```

​	批量操作同样支持：  
```javascript
await chrome.storage.local.set({
  user: {name: 'Tom', age: 18},
  visits: 100
});
const res = await chrome.storage.local.get(['user', 'visits']);
```

------------------------------------------------
3. **与 Web 本地存储的差异**
| 特性               | chrome.storage.local  | window.localStorage        |
| ------------------ | --------------------- | -------------------------- |
| 容量               | 10 MB（可 unlimited） | 5-10 MB 且不可申请更大     |
| 异步               | ✅（Promise & 回调）   | ❌（同步阻塞）              |
| 扩展 ServiceWorker | 直接可用              | ❌ 无法访问                 |
| content_script     | 直接可用              | 与宿主页面共享，需消息中转 |
| 清除浏览数据       | 不会被“清理缓存”删掉  | 会被一键清空               |
| 数据格式           | JSON 可序列化即可     | 仅字符串                   |

------------------------------------------------
4. **开发Tips & 常见坑**

1. **容量超限**  
   写操作一定要 `try…catch`；超出配额时 Promise 会 reject，并带 `runtime.lastError`。  
2. **无痕模式**  
   `storage.local/sync` 数据在拆分式无痕窗口依旧保留，但无痕窗口对扩展来说是独立“会话”，需要把 `setAccessLevel()` 打开才能访问。  
3. **不能直接存 Blob/File**  
   先转 ArrayBuffer → base64 或借 IndexedDB 存二进制，路径/ID 再放进 chrome.storage。  
4. **同步延迟**  
   `storage.sync` 会择机上传，断网时先落本地，在线后自动合并；不要把它当实时数据库。  



### `ResizeObserver` 监听元素

`ResizeObserver` 是一个浏览器原生提供的 JavaScript API，用于**异步监听一个或多个 DOM 元素的尺寸变化**（包括内容区域、边框、滚动条等）。它比 `window.resize` 更精细，只监听元素本身的变化，不依赖窗口大小变化。

---

**使用场景**

- 监听某个 `div` 的宽高变化，动态调整子元素布局
- 图表（如 ECharts、Canvas）随容器尺寸变化自动重绘
- 响应式组件内部逻辑（比 CSS 媒体查询更细粒度）
- 替代旧的 `window.resize + reflow` 方案，性能更好

---

**基本用法**

```js
// 1. 创建观察者
const resizeObserver = new ResizeObserver(entries => {
  for (let entry of entries) {
    const { width, height } = entry.contentRect;
    console.log(`元素尺寸变化：${width} x ${height}`);
  }
});

// 2. 监听目标元素
const box = document.querySelector('#my-box');
resizeObserver.observe(box);

// 3. 停止监听
// resizeObserver.unobserve(box);
// resizeObserver.disconnect();
```

---

**参数详解**

| 属性                              | 说明                                                         |
| --------------------------------- | ------------------------------------------------------------ |
| `entry.contentRect`               | 返回一个 `DOMRectReadOnly`，包含 `x/y/width/height/top/right/bottom/left` |
| `entry.target`                    | 被监听的 DOM 元素                                            |
| `entry.borderBoxSize`             | 包含 `inlineSize` 和 `blockSize`（CSS 逻辑像素）             |
| `entry.contentBoxSize`            | 内容区域尺寸                                                 |
| `entry.devicePixelContentBoxSize` | 物理像素级尺寸（用于 Canvas 高清绘制）                       |



### 浏览器常见监听事件

------------------------------------------------
**一、页面 & 网络生命周期（6 个）**

1. DOMContentLoaded  
   HTML 被解析完，DOM 树已建立；**不等待** css/img 加载。  
   → 最早可安全操作 DOM 的时间点。

2. load  
   页面**所有**资源（css/img/iframe…）加载完毕。  
   → 适合做「隐藏 loading 动画、初始化图表」。

3. beforeunload  
   用户即将离开页面（关标签/刷新/跳转）。  
   → 弹自定义提示或埋点上报；`event.returnValue = ''` 可触发浏览器挽留弹窗。

4. unload  
   文档真正被卸载；**网络请求会受限**（Navigator.sendBeacon 除外）。  
   → 做最后「可靠度要求不高」的埋点。

5. visibilitychange  
   用户切到别的标签或最小化窗口。  
   → 暂停视频、轮询、动画，节省 CPU/流量。

6. online / offline  
   系统连网 / 断网。  
   → 即时切换“离线模式”提示或暂停同步请求。

------------------------------------------------
**二、键盘 & 输入（5 个）**

7. keydown  
   键盘**任意键被按下**即触发；可拦截 F5、Ctrl+S 等。  
   → 快捷键、游戏控制。

8. keyup  
   按键**抬起**；组合键判断常放在这里（避免重复触发）。

9. keypress（已废弃，但 PC 仍支持）  
   仅**字符键**有效；回车、字母、数字。  
   → 老代码里做“按回车提交”。

10. input  
    输入框**内容一变化**就触发；包括键盘、粘贴、拖拽、中文输入法。  
    → 实时字数统计、即时搜索。

11. change  
    输入框**失去焦点且值被修改**后才触发。  
    → 表单校验、提交前汇总。

------------------------------------------------
**三、鼠标 & 滚轮（7 个）**

12. click  
    左键**按下+抬起**在同一元素完成；触屏会模拟。  
    → 按钮、链接、自定义复选框。

13. dblclick  
    连续两次 click；间隔由系统决定。  
    → 桌面端“双击打开文件”交互。

14. contextmenu  
    右键调出上下文菜单；`preventDefault()` 可屏蔽系统菜单。  
    → 自定义右键菜单。

15. mousedown / mouseup  
    按键**按下/抬起**瞬间；先于 click 触发。  
    → 拖拽开始、画图板落笔。

16. mousemove  
    鼠标在元素上**每移动 1px**都会触发；高频。  
    → 拖曳、画板、tooltip 跟随。

17. mouseover / mouseout  
    鼠标**进入/离开**元素边界；会冒泡。  
    → 二级菜单、卡片浮层。

18. wheel（标准名称，旧版 Firefox 用 DOMMouseScroll）  
    滚动滚轮；`deltaY` 可判断方向与速度。  
    → 横向画廊、缩放画布。

------------------------------------------------
**四、焦点 & 表单（4 个）**

19. focus  
    元素**获得焦点**；不冒泡。  
    → 输入框高亮、自动展开下拉。

20. blur  
    元素**失去焦点**；不冒泡。  
    → 失焦校验、保存草稿。

21. submit  
    表单**提交按钮被点击**或回车触发；`preventDefault()` 可拦截做 AJAX 提交。  
    → 统一校验、loading 遮罩。

22. invalid  
    表单校验失败立即触发；可自定义错误提示位置。  
    → 滚动到第一个错误字段。

------------------------------------------------
**五、视图 & 资源 & 异常（8 个）**

23. resize  
    浏览器窗口**尺寸改变**；拖拽分栏、F12 打开都会连续触发。  
    → 重绘图表、重新计算布局。

24. scroll  
    任何滚动条位置变化；包括鼠标滚轮、键盘方向键。  
    → 无限加载、回到顶部按钮显隐。

25. hashchange  
    URL `#` 后面部分变化；不需要刷新页面。  
    → 前端路由（旧版 hash router）。

26. popstate  
    用户点击**前进/后退**按钮；`history.pushState` 可产生新历史记录。  
    → History API 单页路由。

27. load（img / script / iframe）  
    对应外部资源加载完成；可与 `error` 配合做懒加载占位图。

28. error（img / script / window）  
    资源 404 或脚本语法错误；`window.onerror` 能捕获全局 JS 异常。  
    → 统一上报 Sentry。

29. beforeprint / afterprint  
    系统打印对话框**打开/关闭**前后。  
    → 打印专用样式切换、隐藏广告。

30. fullscreenchange  
    进入/退出全屏 API 时触发；可同步更新 UI 按钮状态。



### `addEventListener` 的 `options`参数

------

| 属性名    | 类型          | 默认值  | 说明                                                         |
| --------- | ------------- | ------- | ------------------------------------------------------------ |
| `capture` | `boolean`     | `false` | 是否在**捕获阶段**触发监听器（`true`）还是在**冒泡阶段**（`false`）。 |
| `once`    | `boolean`     | `false` | 监听器是否**只执行一次**，执行后自动移除。                   |
| `passive` | `boolean`     | `false` | 表示监听器**不会调用 `preventDefault()`**，用于优化滚动性能。 |
| `signal`  | `AbortSignal` | `false` | 允许通过 `AbortController` **外部控制移除监听器**（使用较少）。 |



### `.append` 和 `.appendChild` 对比

| 特性         | `.append()`                                     | `.appendChild()`                                     |
| ------------ | ----------------------------------------------- | ---------------------------------------------------- |
| **所属规范** | DOM Living Standard（现代）                     | DOM Level 3 Core（传统）                             |
| **参数类型** | 灵活：DOM 节点、HTML 字符串、文本、甚至多个参数 | 严格：只能是一个 DOM 节点                            |
| **返回值**   | 无（`undefined`）                               | 被添加的节点                                         |
| **文本支持** | 直接支持插入文本                                | 不支持直接插入文本，需用 `document.createTextNode()` |
| **性能**     | 现代浏览器优化，性能略优                        | 传统方法，性能略逊                                   |
| **使用场景** | 现代开发，简洁灵活                              | 兼容旧环境或需返回节点引用                           |

---

**示例对比**

`.append()` 示例

```javascript
const parent = document.getElementById('parent');
parent.append('Hello', document.createElement('span'), 'World');
// 直接插入文本、节点，支持多个参数
```

`.appendChild()` 示例

```javascript
const parent = document.getElementById('parent');
const child = document.createElement('div');
const text = document.createTextNode('Hello');
child.appendChild(text); // 需显式创建文本节点
parent.appendChild(child); // 只能插入节点，返回 child
```



### `.appendChild(createTextNode) `和 `.textContent` 对比

| 维度               | appendChild(createTextNode)                | textContent = …                                  |
| ------------------ | ------------------------------------------ | ------------------------------------------------ |
| **做的事**         | 新建一个 Text 节点，插到元素子节点列表末尾 | 把元素的所有子节点清空，换成一个单独的文本节点   |
| **副作用**         | 保留原有子节点，只追加                     | 会**移除原有所有子节点**（包括元素、注释、文本） |
| **可追加多个文本** | 可以多次调用，产生多个同级文本节点         | 每次赋值会覆盖上一次内容                         |
| **性能/代码量**    | 代码长，可能产生多余节点                   | 一行搞定，浏览器高度优化                         |
| **返回值**         | 返回新建的 Text 节点                       | 无返回值（赋值语句）                             |
| **兼容性**         | IE6+                                       | IE9+（旧版 IE 用 innerText）                     |



### store 写法对比

------

这两种“Store”写法本质上是**“类实例” vs  “单例对象”** 的区别。 

| 维度           | 第一种（class 实例）                       | 第二种（单例对象）                                        |
| -------------- | ------------------------------------------ | --------------------------------------------------------- |
| **创建方式**   | `new Store()` 产生独立实例                 | 文件直接导出一个字面量对象                                |
| **实例个数**   | 想 new 多少个就多少个                      | 整个运行时只有一份（单例）                                |
| **状态隔离性** | 多实例之间互不干扰                         | 全局共享，任何模块改一处全变                              |
| **类型/契约**  | 有构造函数、原型方法，易配 TypeScript 接口 | 纯对象，无类型约束，靠约定                                |
| **可测试性**   | 可 mock 实例、单元测试无全局副作用         | 全局单例，测试需手动重置状态，易耦合                      |
| **扩展性**     | 可以继承、混入、装饰器增强                 | 只能直接改对象或包装代理                                  |
| **树摇/打包**  | 类声明可被摇掉未用代码                     | 对象属性都是静态引用，难摇                                |
| **使用场景**   | 需要多份独立数据（多画板、多房间、多窗口） | 整个应用只有一份配置/开关（全局主题、当前用户、当前工具） |
| **心智模型**   | 更像“服务”或“实体”                         | 更像“全局配置表”                                          |

 现代更推荐使用class实例的写法，class 是更通用、可扩展、结构清晰的方式。



### `window`和`document`在事件绑定上的对比

------

- **window** = 浏览器**整个标签页**（顶级 JS 运行实体、视口、全局作用域）  
- **document** = 当前页面里的**那份 HTML 文档**（DOM 树的根节点）

| 维度                  | window                                                       | document                                                     |
| --------------------- | ------------------------------------------------------------ | ------------------------------------------------------------ |
| 代表范围              | **BOM**（Browser Object Model）整个标签页                    | **DOM** 这份 HTML 文档                                       |
| 全局作用域            | ✅ `var foo` 会成为 `window.foo`                              | ❌ 不会成为 `document.foo`                                    |
| 提供哪些常用属性/方法 | `innerWidth/innerHeight`、<br>`scrollX/scrollY`、<br>`setTimeout`、`fetch`、`localStorage`、<br>`alert/confirm/prompt` | `getElementById`、`querySelector`、<br>`createElement`、`cookie`、<br>`documentElement`（`<html>`）、<br>`head`、`body` |
| 可否拿到 DOM 节点     | 只能间接通过 `document`                                      | 直接——本身就是根节点                                         |

---

 **事件绑定写法（addEventListener）**

**① 绑在 window 上**

```js
window.addEventListener('scroll', () => { ... });
window.addEventListener('resize', () => { ... });
window.addEventListener('load', () => { ... });   // 所有资源（含图片）加载完
```
- 监听的是**浏览器窗口级**事件：滚动条位置变化、窗口大小变化、资源加载完成、哈希变化、存储变化等。

**② 绑在 document 上**

```js
document.addEventListener('DOMContentLoaded', () => { ... }); // DOM 树解析完
document.addEventListener('click', handler);   // 事件捕获/冒泡到 document
document.addEventListener('visibilitychange', handler);
```
- 监听的是**文档自身**或**DOM 事件**：DOM 就绪、点击、键盘、剪贴板、可见性变化等。

**③ 事件流路径**

捕获阶段：`window → document → <html> → … → 目标元素`  
冒泡阶段：反向回到 `window`。  
因此**把监听器放 window 还是 document**，只决定**事件流里谁先谁后**，功能上常常都能收到冒泡，但：
- 需要最早截获 → 绑 `window`  
- 只需 DOM 层且比 `html` 早 → 绑 `document`



### 监听事件对象类型和其方法

---

**一、事件类型 → 事件对象类型对照表**

| 事件类型（字符串）                                           | 事件对象类型      | 典型场景        |
| ------------------------------------------------------------ | ----------------- | --------------- |
| click / dblclick / mousedown / mouseup / mousemove / mouseover / mouseout / contextmenu | **MouseEvent**    | 鼠标            |
| wheel                                                        | **WheelEvent**    | 滚轮            |
| drag / dragstart / dragend / dragover / drop                 | **DragEvent**     | 拖拽            |
| keydown / keyup / keypress                                   | **KeyboardEvent** | 键盘            |
| touchstart / touchmove / touchend / touchcancel              | **TouchEvent**    | 触屏            |
| input                                                        | **InputEvent**    | 输入框内容变化  |
| focus / blur / focusin / focusout                            | **FocusEvent**    | 焦点            |
| scroll / resize / load / error / abort …                     | **Event**         | 通用/无特殊数据 |

---

**二、各事件对象类型“独有”属性/方法**

1. **MouseEvent（继承 WheelEvent、DragEvent）**

- `clientX / clientY` 视口坐标  
- `pageX / pageY` 文档坐标  
- `screenX / screenY` 屏幕坐标  
- `button` 按下的是哪个键（0 左 1 中 2 右）  
- `buttons` 位掩码，同时按下的键集合  
- `ctrlKey / shiftKey / altKey / metaKey` 修饰键布尔值  
- `relatedTarget` 相关元素（mouseenter/mouseleave 中 from/to 的元素）

2. **WheelEvent（继承 MouseEvent）**

- `deltaX / deltaY / deltaZ` 滚动量  
- `deltaMode` 单位（0=像素 1=行 2=页）

3. **DragEvent（继承 MouseEvent）**

- `dataTransfer` DataTransfer 对象（setData / getData / dropEffect …）

4. **KeyboardEvent**

- `key` 字符值（如 "a" "Enter"）  
- `code` 物理键代码（如 "KeyA"）  
- `location` 键盘区域（0 标准 1 左侧 2 右侧 3 小键盘）  
- `repeat` 长按自动重复标志  
- `ctrlKey / shiftKey / altKey / metaKey`（与鼠标相同）

5. **TouchEvent**

- `touches` 当前屏幕所有触点（TouchList）  
- `targetTouches` 当前元素上的触点  
- `changedTouches` 本次事件中改变的触点  
- `altKey / metaKey / ctrlKey`（修饰键）

6. **InputEvent**

- `data` 输入的字符串（插入/删除内容）  
- `inputType` 操作类型（"insertText" "deleteContentBackward" …）  
- `isComposing` 是否处于输入法组合阶段

7. **FocusEvent**

- `relatedTarget` 焦点从哪个元素来/到哪个元素去

---

**三、所有事件对象共有的属性/方法**

（定义在 Event.prototype，任何事件都能用）

| 属性/方法                    | 说明                                             |
| ---------------------------- | ------------------------------------------------ |
| `type`                       | 事件名字符串（"click" 等）                       |
| `target`                     | 真正触发事件的元素                               |
| `currentTarget`              | 绑定监听器的元素（=== 回调里 this 若未箭头函数） |
| `eventPhase`                 | 0 none 1 capturing 2 target 3 bubbling           |
| `timeStamp`                  | 相对页面生命周期的事件发生时间（毫秒）           |
| `bubbles`                    | 布尔，是否冒泡                                   |
| `cancelable`                 | 布尔，是否可调用 preventDefault()                |
| `composed`                   | 布尔，能否穿透 Shadow DOM                        |
| `preventDefault()`           | 阻止默认行为                                     |
| `stopPropagation()`          | 停止冒泡/捕获                                    |
| `stopImmediatePropagation()` | 停止且同元素剩余监听器也不执行                   |
| `composedPath()`             | 返回事件冒泡路径数组                             |



### `,` 逗号运算符

------------------------------------------------
1. **语法**
```js
expr1, expr2, ..., exprN
```
- 从左到右**依次计算**每个表达式；  
- **整个表达式的结果**只取**最后一个**（`exprN` 的值）。

------------------------------------------------
2. **错误示例：**

```js
return x, y;   // 先算 x，再算 y，最终把 y 的值返回出去
```
因此调用者只能拿到 `y`，`x` 被**计算但丢弃**。

------------------------------------------------
4. **常见用途**（刻意利用“副作用”）
1. **一行写多个副作用**  
   
   ```js
   while (a++, b--, a < b) { /* ... */ }
   ```
   
2. **箭头函数里想偷偷干两件事**  
   ```js
   arr.map((v, i) => (console.log(i), v * 2));
   ```

3. **压缩代码**
   
   ```js
   return i++, j++, k;
   ```



### 解构类型及其语法

------------------------------------------------
一、两大基础类型

| 类型         | 依据             | 写法示例             | 主要用途   |
| ------------ | ---------------- | -------------------- | ---------- |
| **对象解构** | 用 **键名** 匹配 | `const {a, b} = obj` | 取对象属性 |
| **数组解构** | 用 **位置** 匹配 | `const [x, y] = arr` | 取序列元素 |

------------------------------------------------
二、六类使用场景

1. **声明解构**  
   
   ```javascript
   let {name, age} = user;
   const [first, second] = arr;
   ```
   特点：顺便创建新变量，最常用（要求变量名和对象的键名相同）
   
2. **赋值解构（刷新已有变量）**  
   
   ```javascript
   var name, age;
   ({name, age} = user);   // 对象必须加 ()
   [first, second] = arr;  // 数组无需 ()
   ```
   
3. **函数参数解构**  
   
   ```javascript
   function foo({name, age}) { ... }
   function bar([x, y]) { ... }
   ```
   特点：签名即解构，调用时传对象/数组即可。
   
4. **嵌套解构**  
   
   ```javascript
   const {user: {name}} = response;
   const [a, [b, c]] = [1, [2, 3]];
   ```
   
5. **剩余/展开解构**  
   
   ```javascript
   const {a, ...rest} = {a: 1, b: 2, c: 3};
   const [x, ...y] = [1, 2, 3];
   ```
   
6. **带默认值解构**  
   
   ```javascript
   const {x = 0, y = 0} = point;
   const [a = 0, b = 0] = arr;
   ```

------------------------------------------------
三、特殊用法

- **字符串** → 可“类数组”解构  
  
  ```javascript
  const [a, b] = 'hi';   // a='h', b='i'
  ```
  
- **Map/Set** → 用数组解构  
  
  ```javascript
  const [first] = new Set([10, 20]); // first=10
  ```
  
- **NodeList** → 数组解构  
  ```javascript
  const [firstImg] = document.querySelectorAll('img');
  ```



### `WeakMap` 数据结构

------

> `WeakMap` 是 JavaScript 中的一种特殊数据结构，它是 **“键值对”集合**，但它的“键”必须是**对象（包括 DOM 元素）**，不能是字符串或数字。

**常见用途：**

- 把额外信息关联到一个对象上
- 管理某个 DOM 元素的事件、状态、配置等
- 防止内存泄漏

---

**`WeakMap` vs 普通 `Map` 的关键区别**

| 特性                       | `Map` | `WeakMap`                                 |
| -------------------------- | ----- | ----------------------------------------- |
| 键可以是任意类型           | ✅ 是  | ❌ 否（只能是**对象/元素**，不能是字符串） |
| 强引用（阻止垃圾回收）     | ✅ 是  | ❌ 否                                      |
| 弱引用（不阻止垃圾回收）   | ❌ 否  | ✅ 是 （核心优势）                         |
| 可遍历所有 key             | ✅ 是  | ❌ 否                                      |
| 支持 `.clear()` 和 `.size` | ✅ 是  | ❌ 否                                      |

---

**普通 `Map`：强引用 → 内存泄漏风险**

```js
const map = new Map();
const div = document.createElement('div');
map.set(div, 'some data');

// 如果你把 div 从页面删除了
document.body.removeChild(div);
// 但是 map 还持有 div 的引用！
// 所以浏览器不会释放 div 的内存 → 内存泄漏
```

 **`WeakMap`：弱引用 → 自动清理**

```js
const wm = new WeakMap();
const div = document.createElement('div');
wm.set(div, 'some data');

// 删除 div
document.body.removeChild(div);

// 当没有任何其他变量引用 div 时，
// 浏览器会自动回收 div 的内存
// 并且 wm 中对应的条目也会自动消失
```

------

**应用场景：**

| 场景                                          | 推荐使用 `WeakMap`？ |
| --------------------------------------------- | -------------------- |
| 给 DOM 元素存一些私有数据（如状态、事件回调） | ✅ 是！非常推荐       |
| 缓存函数计算结果（key 是对象）                | ✅ 是                 |
| 需要遍历所有 key 或统计数量                   | ❌ 不行，用 `Map`     |
| key 是字符串或数字                            | ❌ 不行，用 `Map`     |
| 担心内存泄漏                                  | ✅ 优先考虑 `WeakMap` |



### `setTimeout(() => {});` 空定时器 

------

利用了 **事件循环机制**，把一条**宏任务**插到当前调用栈末尾，**让出线程**，**推迟后续代码的执行时机**。

| 场景                      | 空定时器带来的效果                                           |
| ------------------------- | ------------------------------------------------------------ |
| **强制异步**              | 把同步代码“变成”异步，确保后续代码在下一个事件循环周期执行   |
| **让浏览器先渲染**        | 先让出线程，让浏览器完成一次样式计算、重绘，再执行后续逻辑   |
| **规避“调用栈深度”警告**  | 递归太深时，拆成多个宏任务，防止栈溢出                       |
| **hack 第三方库生命周期** | 某些库（如旧版 Vue、Swiper）在同步阶段未就绪，推迟一帧再访问 DOM |

---

**对比其他“异步 0 延迟”写法**

| 写法                            | 任务类型   | 执行顺序                 | 用途         |
| ------------------------------- | ---------- | ------------------------ | ------------ |
| `setTimeout(()=>{});`           | 宏任务     | 晚于当前同步代码、微任务 | 通用“让一帧” |
| `Promise.resolve().then()`      | 微任务     | 比空定时器更早           | 高优先级异步 |
| `queueMicrotask(()=>{})`        | 微任务     | 同上                     | 明确微任务   |
| `requestAnimationFrame(()=>{})` | 渲染前任务 | 下一帧渲染前             | 与动画对齐   |

---

**示例：让浏览器先渲染**

```js
box.textContent = '开始计算...';
// 如果不加空定时器，下面耗时任务会卡住渲染，
// 用户看不到“开始计算...”
setTimeout(() => {
  heavyTask();          // 耗时 500 ms
}, 0);
```



### 控制页面滚动方法总结

---

1. **滚动对象**

| 目标     | 代码实体                               |
| -------- | -------------------------------------- |
| 整个视口 | `window` / `document.documentElement`  |
| 某个容器 | `element`（任何出现滚动条的 DOM 节点） |

---

2. **滚动位置**

| 需求         | 关键属性 / 方法                                              | 备注                               |
| ------------ | ------------------------------------------------------------ | ---------------------------------- |
| 绝对坐标     | `scroll(x,y)` 或 `scrollTo(x,y)`                             | 等价；`window` 与 `element` 皆可用 |
| 相对偏移     | `scrollBy(dx,dy)`                                            | 正数向下/右                        |
| 滚到元素可见 | `elem.scrollIntoView(options)`                               | 可选 `block`、`inline`、`behavior` |
| 读取当前位置 | `scrollY` / `scrollX`（window）<br>`elem.scrollTop` / `scrollLeft`（element） | 只读；兼容写法 `pageYOffset`（IE） |

---

3. **平滑 or 瞬时**

| 行为 | 写法                                                         | 兼容性          |
| ---- | ------------------------------------------------------------ | --------------- |
| 瞬时 | 直接传数字：`window.scrollTo(0, 800)`                        | 全支持          |
| 平滑 | 1. CSS 全局：`html{scroll-behavior:smooth}`<br>2. 行内：`scrollTo({top:800, behavior:'smooth'})`<br>3. 平滑 Polyfill（旧浏览器） | IE/旧 Edge 需 3 |

---

4. **滚动“动画”全控制（自动/匀速/缓动）**

| 场景           | 技术                             | 样板代码            |
| -------------- | -------------------------------- | ------------------- |
| 自动滚动       | `setInterval` + `scrollBy(0, 1)` | 简单但掉帧          |
| 平滑到指定位置 | `requestAnimationFrame` + 缓动   | 见下方通用函数      |
| 无限循环轮播   | `RAF` + 重置 `scrollTop`         | 模拟 marquee        |
| 横向拖拽滚动   | `pointermove` 改 `scrollLeft`    | 监听 `clientX` 差值 |

------

**通用缓动封装示例（垂直/横向、任意元素）**

```js
function smoothScrollTo(target, endValue, duration = 600, direction = 'top') {
  const startValue = (target === window ? window[`scroll${direction}`] : target[`scroll${direction}`]);
  const startTime = performance.now();

  (function frame(now) {
    const t = Math.min((now - startTime) / duration, 1);
    const eased = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t; // easeInOutQuad
    const pos = startValue + (endValue - startValue) * eased;
    target === window
      ? window.scrollTo({ [`${direction.toLowerCase()}`]: pos })
      : (target[`scroll${direction}`] = pos);
    if (t < 1) requestAnimationFrame(frame);
  })();
}
// 用法
smoothScrollTo(window, 1200, 800, 'Top');        // 页面垂直滚动
smoothScrollTo(document.querySelector('.box'), 500, 400, 'Left'); // 容器横向
```

---

5. **滚动监听 & 性能**

| 需求       | API                                         | 性能提示                                  |
| ---------- | ------------------------------------------- | ----------------------------------------- |
| 位置监听   | `window.onscroll` / `elem.onscroll`         | 防抖 16 ms 或 `IntersectionObserver` 替代 |
| 进入可视区 | `IntersectionObserver`                      | 长列表懒加载首选                          |
| 滚动边界   | `scrollHeight - scrollTop === clientHeight` | 触底加载更多                              |



### `requestAnimationFrame`（rAF）和 `cancelAnimationFrame`（cAF）

`requestAnimationFrame`（rAF）和 `cancelAnimationFrame`（cAF）是浏览器专门为动画设计的 API，不是延时器，也不是 `setTimeout` 的替代品。它们的核心价值是：**把代码执行节奏跟浏览器的“刷新节拍”对齐**，从而省功耗、免掉帧、保证流畅。

---

1. **屏幕刷新机制**

- 主流显示器以 60 Hz 为主，即每 16.67 ms 产生一帧。  
- 浏览器在每一帧里需要完成：  
  1. 执行 JS  
  2. 计算样式（Recalc Style）  
  3. 布局（Layout）  
  4. 绘制（Paint）  
  5. 合成（Composite）  
- 如果 JS 执行时间过长 > 16.67 ms，就会掉帧（卡顿）。

---

2. **`requestAnimationFrame`**

```js
const id = requestAnimationFrame(callback);
```
- 把 `callback` 注册到浏览器“下一帧”任务队列。  
- 浏览器会在下一次重绘之前自动调用它，并传入一个高精度时间戳 `DOMHighResTimeStamp`（单位 ms，精确到 5 µs 级）。  
- 返回值 `id`是一个整数句柄，用于后续`cancelAnimationFrame`取消。

**特点**

1. **与刷新率同步**：60 Hz 屏幕约每 16.67 ms 调一次；120 Hz 屏约 8.33 ms。  
2. **节能**：标签页切到后台或最小化时，浏览器自动暂停 rAF，前台恢复后继续，不会白白消耗电池。  
3. **最安全的动画场所**：在 rAF 回调里修改样式/位置，浏览器会集中合并到同一帧，避免多次重排。  
4. **可链式**：常见写法是在回调末尾再 `requestAnimationFrame(tick)`，实现“无限循环”。

---

3. **`cancelAnimationFrame`**

```js
cancelAnimationFrame(id);
```
- 把尚未执行的那一次 rAF 取消，相当于“把刚刚排队的动画帧票撕掉”。  
- 如果回调已经执行完毕，cAF 无影响；因此不会回滚任何已渲染结果。  
- 常用于用户主动中断动画（点击停止、组件卸载、页面隐藏等）。

---

4. **与 `setTimeout/setInterval` 的区别速览**

| 特性     | requestAnimationFrame  | setTimeout/setInterval   |
| -------- | ---------------------- | ------------------------ |
| 节拍     | 跟随屏幕刷新率         | 固定毫秒数               |
| 后台标签 | 自动暂停，节能         | 仍继续触发               |
| 最小延迟 | 0 ms（下一帧）         | 4 ms（HTML 标准下限）    |
| 帧合并   | 浏览器自动合并样式变更 | 每次到期立即执行，易多排 |
| 精度     | 亚毫秒级时间戳         | 4 ms 粒度                |
| 用途     | 动画、滚动、连续绘制   | 一次性/轮询任务、非动画  |



### 错误解决：

#### `.offsetWidth` `.offsetHeight`无法获取到正确宽高

------

**原因：**

因为在打印 `cardDiv.offsetWidth` 和 `cardDiv.offsetHeight` 时，`cardDiv` 还没有被插入到 `document.body`，此时它**还未渲染**，宽高为 0。**（计算依据为布局时的元素宽高）**

只有当元素被添加到 DOM 并渲染后，浏览器才会计算其实际尺寸。

**解决：**

先 `document.body.appendChild(cardDiv)`，再读取 `offsetWidth` 和 `offsetHeight`。

```js
document.body.appendChild(cardDiv);
console.log(cardDiv.offsetWidth, cardDiv.offsetHeight);
```



#### 报错`HierarchyRequestError: Only one element on document allowed`

------

**原因：**当前页面里已经有 `<html>`（或 `<body>`、`<head>`）这类顶级节点，而又试图再往 `document` 上 `appendChild` 一次，于是浏览器直接报错**（浏览器只接受一个 `document.documentElement`）**

**解决：**

```js
document.appendChild(panel);   // 错误写法
document.body.appendChild(panel);  // 正确写法
```



#### 获取`Dom`元素失败

------

**问题：**在 `activateGraffiti()` 中，`createControls()` 明明先执行了，但后续执行 `activateRectangleAnnotation()` 时却获取不到 `.tool-group` 元素（即 `toolGroupDiv` 是 `null`）

**原因：**只是在`createControls()`中创建并插入了 DOM 元素，但此元素可能尚未真正挂载到页面中（即未完成渲染），需要等到下一个渲染帧（下一帧）才会渲染此元素，此时还获取不到此元素。（  `appendChild` 是同步的，但 DOM 挂载是异步的）

**解决：**

------

**方案一：使用 `requestAnimationFrame` 延迟执行**

你可以将 `activateRectangleAnnotation()` 放在一个 `requestAnimationFrame` 中，确保 DOM 已经挂载：

```js
export function activateGraffiti(){
  createDrawingCanvas();
  loadDrawing();
  createControls();

  requestAnimationFrame(() => {
    activateRectangleAnnotation();
  });

  setupEventListeners();
}
```

或者使用 `setTimeout(..., 0)` 也可以达到类似效果：

```js
setTimeout(() => {
  activateRectangleAnnotation();
}, 0);
```

---

**方案二：在 `createControls()` 中返回一个 Promise，并 await 它**

更优雅的方式是让 `createControls()` 返回一个 Promise，在 DOM 挂载完成后 resolve：

```js
function createControls(){
  return new Promise((resolve) => {
    const cardDiv = document.querySelector('.functions');
    if (document.getElementById('graffiti-controls')) {
      resolve();
      return;
    }

    // ...创建 controls 的代码...

    cardDiv.appendChild(graffitiControlsDiv);

    // 等待 DOM 渲染完成再 resolve
    requestAnimationFrame(() => {
      resolve();
    });
  });
}
```

然后在 `activateGraffiti()` 中：

```js
export async function activateGraffiti(){
  createDrawingCanvas();
  await loadDrawing();
  await createControls(); // 等待控件真正挂载完成
  activateRectangleAnnotation(); // 此时可以安全访问
  setupEventListeners();
}
```



#### 保证面板在窗口内函数检测的长宽为以前的数据


------

**原因：**首先在`click`事件中刚调整面板状态为激活，随后便调用`updatePosition` 函数，此时DOM样式可能还没更新，使用requestAnimationFrame 确保 DOM 更新后再执行位置计算，但仍没有解决问题。

```js
        requestAnimationFrame(() => {
            updatePosition();
        });
```

后来发现 CSS中有`transition`动画对面板长宽进行过渡，导致调用`updatePosition()`时长宽数据还停留在未展开的时候，进而导致更新位置的函数使用的是关闭时的面板长宽数据。

**解决：**可以使用`setTimeout()`来配合动画进行结束后再调整位置，但有等待延时，所以目前采用的是在判断函数中使用展开的面板数据来进行位置计算。



#### `EventManager` 中事件监听器始终不匹配 

------

**问题：**

```js
const key = `${element},${event}`;
```

把 DOM 对象直接拼接到字符串里，会被自动转换成 `[object HTMLDivElement]`，而不是期望的变量名（如 `"bookmarkDiv"`）

**原因：**因为传入的`bookmarkDiv` 是一个 **DOM 元素对象**，不是一个字符串，对于 DOM 元素，默认的 `.toString()` 返回的就是`[object HTMLDivElement]`

**解决：**改为用 DOM 元素本身作为 Map 的 key



#### `shadowRoot` 变量赋值后仍为`undefined`

------

**问题：** `draggablePanel.js.js:34 Uncaught (in promise) TypeError: Cannot read properties of undefined (reading 'appendChild')`

```js
shadowRoot.appendChild(panelDiv); //`shadowRoot` 是 `undefined`
```

------

**原因：**变量提升 + 异步加载顺序错乱

```js
const shadowRoot = window.__EDULENS_SHADOW_ROOT__;
```

在 `function DraggablePanel()` **外面、顶部**，这意味着它只会在模块加载时执行一次，此时 `window.__EDULENS_SHADOW_ROOT__` 还没被赋值。

**执行顺序**如下：

1. `content-script.js` 开始运行

2. 导入 `draggablePanel.js` →  立刻执行顶层代码：

   ```
   const shadowRoot = window.__EDULENS_SHADOW_ROOT__; // 此时是 undefined！
   ```

3. 执行 `await injectStyles()` → 异步加载 CSS 并设置 `window.__EDULENS_SHADOW_ROOT__`

4. 调用 `activateDraggablePanel()` → 进入 `DraggablePanel()` 函数

5. 使用早已缓存的 `shadowRoot`（仍然是 `undefined`）→ 报错！

------

**解决**：不要在模块顶层捕获 `shadowRoot`，而是在函数内动态获取。（**永远不要在模块顶层依赖异步初始化的全局变量**）



#### 报错：`shadowRoot.getElementsByClassName is not a function`

------

**问题：**`bookmark.js.js:148 Uncaught (in promise) TypeError: shadowRoot.getElementsByClassName is not a function`

```js
const cardDiv = shadowRoot.getElementsByClassName('functions')[0];
```

**原因：**`ShadowRoot` 不支持 `getElementsByClassName` 方法

因为：`shadowRoot` 是一个 `DocumentFragment` 类型的对象（具体是 `ShadowRoot`），它没有 `getElementsByClassName()` 方法

**解决：**使用 `querySelector` / `querySelectorAll`来代替

---

**`ShadowRoot` 支持的查询方法有哪些？**

| 方法                                       | 是否支持 |
| ------------------------------------------ | -------- |
| `shadowRoot.querySelector(selector)`       | ✅ 支持   |
| `shadowRoot.querySelectorAll(selector)`    | ✅ 支持   |
| `shadowRoot.getElementById(id)`            | ✅ 支持   |
| `shadowRoot.getElementsByClassName(names)` | ❌ 不支持 |
| `shadowRoot.getElementsByTagName(tagName)` | ❌ 不支持 |
| `shadowRoot.getElementsByName(name)`       | ❌ 不支持 |





#### 可以打印出的DOM元素获取不到

---

**问题：**

`drawingContainer` 打印出来有值，且内部确实包含了 `<canvas id="graffiti-canvas">`，  
但是用：

- `drawingContainer.querySelector('#graffiti-canvas')`
- 或者 `shadowRoot.getElementById('graffiti-canvas')`

查询`graffiti-canvas`元素都返回 `null`

**原因：**

因为你可能在后续调试时查看了控制台输出的 **对象快照（live object）**。

JavaScript 控制台对 DOM 对象的打印是“动态引用”，不是“冻结快照”。也就是说如果在 `console.log`后给这个元素添加了子元素，在调试查看时仍然能看见子元素。（不能代码 `console.log` 时子元素存在）



#### `shadowRoot` 内部无法找到存在的顶层元素

------

**原因：**

```js
const elements = shadowRoot.elementsFromPoint(x + window.scrollX, y + window.scrollY);
```

 `shadowRoot.elementsFromPoint` 并 **不会穿透 Shadow DOM** 的边界，它只能获取 Shadow DOM 外部的元素，而 `.annotation-rect` 是放在 Shadow DOM 内部 的。

**解决：**换成 `elementFromPoint `直接找到顶层的第一个元素。

| 特性                | `elementFromPoint(x, y)`            | `elementsFromPoint(x, y)`                  |
| ------------------- | ----------------------------------- | ------------------------------------------ |
| **返回值**          | **单个元素**（最上层命中元素）      | **数组**（从顶到底所有命中元素）           |
| **Shadow DOM 支持** | ✅ 可以命中 **Shadow DOM 内部元素**  | ❌ **不会穿透 Shadow DOM 边界**，返回空数组 |
| **典型用途**        | 获取最上层元素                      | 获取多层叠加元素列表                       |
| **兼容性**          | 所有现代浏览器                      | 现代浏览器（IE 不支持）                    |
| **示例**            | `shadowRoot.elementFromPoint(x, y)` | `document.elementsFromPoint(x, y)`         |



#### 滚动后立即截图会截入 `mask`遮罩元素

------

**原因 ：**
`requestAnimationFrame` 和 `setTimeout(()=>{})` 都只能把“隐藏代码”推迟到**下一帧任务队列**，但浏览器**真正完成重绘（paint）的时机**比这两件事都晚：  

1. 宏任务（`setTimeout`/`rAF`）→ 2. 浏览器计算样式 → 3. 布局（layout）→ 4. 绘制（paint）→ 5. 合成（composite）  
截图指令（`chrome.runtime.sendMessage({type:'SCREENSHOT'})`）在第 1 步就发出，而绘制线程还没把 `regionDiv` 抹掉，于是它被拍进去了。  
页面滚动时浏览器会触发**额外的合成层光栅化**，paint 被延后得更明显，所以问题只在滚动后必现。

------

**解决：**

**方案 1：使用双 rAF 再推迟一帧（最简可靠）**

把截图再往后挪一整帧，让浏览器先完成 paint/composite：

```js
async function handleMouseUp(e) {
  if (!store.isRegion) return;

  regionDiv.style.display = 'none';          // 1. 立即标记隐藏
  restorePageInteraction();
  store.updateState();

  // 2. 等浏览器完成下一帧 paint 再截图
  requestAnimationFrame(() => {
    requestAnimationFrame(async () => {      // 双 rAF ≈ 下一帧 paint 后
      const response = await chrome.runtime.sendMessage({type: 'SCREENSHOT'});
      imageData = response.image;
      panelDiv.style.visibility = 'visible';

      const infos = { /* … */ };
      const croppedImage = await cropImg(imageData, infos);
      copyImg(croppedImage);
      downloadImg(croppedImage);
    });
  });
}
```

> 两次 `requestAnimationFrame` 是社区公认“等一帧 paint 完成”的简便写法，**无需额外 API**。

---

**方案 2：使用 `IntersectionObserver` 监听“真正消失”**

若对时机要求极致，可用 `IntersectionObserver` 确认 `regionDiv` 已完全退出视口/不再被绘制后再截图，但多数场景双 rAF 已足够。

---

**方案 3：改为给元素加 `visibility: hidden`**

`display: none` 会触发重排，`visibility: hidden` 只触发重绘且不会被拍进位图。





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



### `<html>` 和   `<body> `对比

------

把整张 HTML 页面想成一栋两层小楼：

- `<html>` 元素 = 整栋楼的外壳（从地基到屋顶），它里面只允许放两个“房间”：  `<head>`  `<body>`  
- `<body>` 元素 = 楼里真正“住人”的那一层，所有肉眼能看到的内容（文字、图片、按钮、画布……）都必须放在这一层。  

|  对比点  | `<html>`                                                 | `<body>`                                                     |
| :------: | -------------------------------------------------------- | ------------------------------------------------------------ |
| 节点类型 | 根元素（Root Element）                                   | 根元素的唯一子元素之一                                       |
| 可见内容 | 本身不可见，只当容器                                     | 存放所有可见内容                                             |
| 默认样式 | 浏览器会给它加上与视口等高的块盒，滚动条通常也绑在它身上 | 默认 8px margin（可被 reset）                                |
| 常见用途 | 取整页滚动值、设置 CSS 变量、全屏背景                    | 插入可见节点、局部滚动容器、页面级事件委托                   |
| 能否缺失 | 写不写标签它都在；HTML 解析器会自动补                    | 源码里没写 `<body>` 标签也会自动补，但在 DOM 构建完成前访问 `document.body` 可能得到 `null` |
| 获取方式 | `document.documentElement`                               | `document.body`                                              |



### `data-*`自定义数据

------

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



### `<input type="range">` 滑动条控件

让用户通过 **拖拽滑块** 在一段连续区间内选择一个数值。它属于**表单元素**，但比普通的 `<input type="number">` 更直观、更节省空间。

---

**基本语法**

```html
<input type="range" min="0" max="100" step="1" value="50">
```

| 属性    | 说明                                           |
| ------- | ---------------------------------------------- |
| `min`   | 可选，最小值，默认 0                           |
| `max`   | 可选，最大值，默认 100                         |
| `step`  | 可选，步长，默认 1；可为任意正数或 `"any"`     |
| `value` | 可选，初始值；若不写则取 `min` 与 `max` 的中点 |

---

**样式定制**

浏览器给 range 拆成了多个伪元素，但无标准命名，必须写 **两套私有前缀**：

| 部位 | WebKit/Blink (Chrome/Safari/Edge) | Firefox              |
| ---- | --------------------------------- | -------------------- |
| 轨道 | `::-webkit-slider-runnable-track` | `::-moz-range-track` |
| 滑块 | `::-webkit-slider-thumb`          | `::-moz-range-thumb` |

---

**事件**

| 事件名   | 触发时机                                   |
| -------- | ------------------------------------------ |
| `input`  | 滑块 **一移动** 就触发（最常用，实时响应） |
| `change` | 滑块 **松开鼠标** 后才触发（类似失焦）     |

---

**滑动刻度**

可用 `list` 属性绑定 `<datalist>` 提供刻度：

```html
<input type="range" list="ticks" min="0" max="50" step="25">
<datalist id="ticks">
  <option value="0">
  <option value="25">
  <option value="50">
</datalist>
```
浏览器会在轨道下方显示浅色刻度（WebKit 支持较好）。



### `cursor` 值总览

| #    | 关键字        | 典型外观示意 | 语义/场景                  |
| ---- | ------------- | ------------ | -------------------------- |
| 1    | auto          | 浏览器默认   | 由 UA 决定，通常是 default |
| 2    | default       | ➤            | 标准箭头                   |
| 3    | none          | 完全隐藏     | 完全看不见指针             |
| 4    | pointer       | 👆            | 可点击（链接、按钮）       |
| 5    | text          | I            | 文本选择（I-beam）         |
| 6    | vertical-text | Ⅰ            | 竖排文本 I-beam            |
| 7    | help          | ➤＋？        | 有帮助信息                 |
| 8    | context-menu  | ➤＋菜单      | 可呼出上下文菜单           |
| 9    | progress      | ➤＋漏沙      | 后台忙，但可交互           |
| 10   | wait          | 漏沙/转圈    | 系统忙，请等待             |
| 11   | cell          | 粗＋         | 可选取单元格               |
| 12   | crosshair     | ＋           | 精确定位（画图、截图）     |
| 13   | move          | 十字四向箭   | 对象可移动                 |
| 14   | grab          | 张开手       | 可抓取                     |
| 15   | grabbing      | 握拳         | 正在抓取                   |
| 16   | all-scroll    | 圆点四向箭   | 任意方向滚动（地图）       |
| 17   | n-resize      | ↑            | 上边缘调整                 |
| 18   | e-resize      | →            | 右边缘调整                 |
| 19   | s-resize      | ↓            | 下边缘调整                 |
| 20   | w-resize      | ←            | 左边缘调整                 |
| 21   | ne-resize     | ↗            | 东北角调整                 |
| 22   | nw-resize     | ↖            | 西北角调整                 |
| 23   | se-resize     | ↘            | 东南角调整                 |
| 24   | sw-resize     | ↙            | 西南角调整                 |
| 25   | ew-resize     | ↔            | 水平双向调整               |
| 26   | ns-resize     | ↕            | 垂直双向调整               |
| 27   | nesw-resize   | ↗↙           | 东北-西南对角              |
| 28   | nwse-resize   | ↖↘           | 西北-东南对角              |
| 29   | col-resize    | ⇔ 竖虚线     | 可拖动列宽                 |
| 30   | row-resize    | ⇕ 横虚线     | 可拖动行高                 |
| 31   | no-drop       | 👆＋禁止      | 当前不可放置               |
| 32   | not-allowed   | ⃠             | 操作被禁止                 |
| 33   | zoom-in       | 放大镜＋     | 可放大                     |
| 34   | zoom-out      | 放大镜－     | 可缩小                     |
| 35   | copy          | 箭头＋＋     | 可复制                     |
| 36   | alias         | 箭头＋弯箭   | 创建快捷方式/别名          |
| 37   | grab          | 张开手       | 同 #14（标准重名，无冲突） |
| 38   | grabbing      | 握拳         | 同 #15（标准重名，无冲突） |



### 封装创建 DOM 元素方法

------------------------------------------------
**第一种：Object.assign 速写法**

```javascript
box.append(
  Object.assign(document.createElement('a'), {
    href: '/page/2',
    className: 'btn btn-primary',
    textContent: 'Next page'
  })
);
```

1. 执行顺序  
   ① `document.createElement('a')` → 新建一个空 `<a></a>`  
   ② `Object.assign(target, ...sources)` 把后面字面量里的 **可枚举自有属性** 全部拷贝到 target 上。  
   ③ 拷贝完成后，`<a>` 现在相当于：
   
   ```html
   <a href="/page/2" class="btn btn-primary">Next page</a>
   ```
   ④ 把已经“装修好”的节点一次性 `box.append()` 进去。
   
2. 可以拷贝哪些属性  
   – **HTML 标准属性**：`href / src / type / disabled …`  
   – **IDL 属性（property）**：`className / htmlFor / textContent …`  
   – **自定义属性**要用 `setAttribute` 的（如 `data-*`）就不能直接写进 `Object.assign`，因为 `data-id` 不是合法标识符，且 `setAttribute` 不会自动同步到 property。  
   例：想加 `data-id="123"` 还得再补一句  
   ```javascript
   const a = Object.assign(document.createElement('a'), {…});
   a.setAttribute('data-id', '123');
   box.append(a);
   ```

3. 优缺点  
   ✅ 一句话搞定，适合“临时、简单、属性少”的场景。  
   ❌ 属性一多就换行难看；不能处理 `data-*` / 事件监听等；每次都得重复写。

------------------------------------------------
**第二种：小型工厂函数 el()**

```javascript
const el = (tag, attrs = {}, ...children) => {
  const e = document.createElement(tag);
  Object.entries(attrs).forEach(([k, v]) => e.setAttribute(k, v));
  e.append(...children);
  return e;
};

box.append(
  el('div', { class: 'card', 'data-id': 123 }, 'Hello'),
  el('button', { type: 'button', class: 'btn' }, 'Click me')
);
```

1. 函数签名  
   `el(标签名, {属性对象}, ...任意子节点或文本)`  
   返回一个已经“带属性、带子节点”的 DOM 元素。

2. 内部步骤  
   ① `document.createElement(tag)`  
   ② 遍历 `attrs` 对象，**全部走 `setAttribute`** → 因此 `data-*` / `role` / `aria-*` 都能写。  
   ③ 把剩余参数（`children`）直接 `e.append(...children)`，所以子节点可以是文本、也可以是别的节点。 
   ④ 返回建好的元素，供外面自由使用：可以 `append()`、可以 `insertAdjacentElement()`、也可以当模板再克隆。

3. 使用示例扩展

```javascript
// 嵌套结构
const card = el('article', { class: 'post' },
  el('h2', {}, '标题'),
  el('p',  {}, '正文内容')
);
box.append(card);

// 列表一次性生成
box.append(
  ...[1,2,3].map(i =>
    el('li', { class: 'item', 'data-index': i }, `第 ${i} 项`)
  )
);
```

4. 优缺点  
   ✅ 属性、子节点、事件回调都能写；可复用、可组合、无依赖。  
   ✅ 比模板引擎轻量，比字符串拼接安全（不会意外注入 HTML）。  
   ❌ 属性值只能字符串（`setAttribute` 的限制）；需要写 JS，不适合富文本大块模板。



### Shadow DOM 隔离

------

Shadow DOM（影子 DOM）是浏览器提供的一种封装机制，它允许你将**隐藏的 DOM 树**附加到普通的 DOM 元素上，从而实现**样式、结构和行为的隔离**。

**核心特点：**

| 特性             | 说明                                          |
| ---------------- | --------------------------------------------- |
| ✅ **样式隔离**   | 外部 CSS 不会影响 Shadow DOM 内部             |
| ✅ **结构隔离**   | `document.querySelector` 无法直接访问内部元素 |
| ✅ **作用域 DOM** | 内部 ID、class 不会和外部冲突                 |
| ✅ **可复用组件** | 非常适合构建通用插件或 UI 组件                |

**注意**：

- Shadow DOM 内部样式不会继承外部样式（包括字体、颜色等），因此你需要手动引入基础样式，如事件冒泡、样式变量、字体等需要额外处理。
- 不要用 `document` 相关方法去查 Shadow DOM 内的元素（已经隔离会查询不到）

---

**简单示例**：

```html
<div id="host"></div>

<script>
  const host = document.getElementById('host');
  const shadow = host.attachShadow({ mode: 'open' });

  shadow.innerHTML = `
    <style>
      p { color: red; }
    </style>
    <p>我在 Shadow DOM 里，外部样式影响不到</p>
  `;
</script>
```







### 错误解决：

#### `transition` 动画过渡失效

------

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



#### `transform-origin` 不生效问题

------

**解决：**面板打开时没有使用 transform 变换，而是直接改变 width/height，所以 transform-origin 不会影响动画效果



#### `addEventListener` 传参出错

------

**解决：**

```js
element.addEventListener('click', handleClick()); 
// 错误，这样会立即执行 handleClick，并把返回值（undefined）作为监听器
// 不需要在函数名后面加上括号
```



#### `flex:1` 没有自动占据剩余空间

------

**原因：**`.bookmark-input` 写了 `flex: 1` 并不代表它“只能占剩余空间”，它还受到 `min-width: auto` 的默认行为影响. input 的默认最小尺寸 是 `min-width: auto`，也就是说：它不会缩小到比自身内容还窄。

**解决：**给 `.bookmark-input` 显式写一个 最小宽度 0 即可：

```js
.bookmark-input {
  flex: 1;
  min-width: 0;   // 关键 
}
```



#### 注入的CSS样式被网站样式覆盖

------

**问题：**开发者工具中显示部分元素为“淡灰色”（该样式未生效）或者被划（被其他规则覆盖）

**原因：**

虽然这些浏览器插件 CSS 是通过 **Content Script 沙箱机制**注入的（即不属于页面原始代码），但它们最终仍然是被添加到了页面的 DOM 树中，作为 `<style>` 或外链 `<link>` 存在。因此：它们的 **CSS 优先级规则仍然遵循标准浏览器的层叠规则**，仍然可能会被更高优先级样式覆盖：

- 网站很可能已经定义了同名类（比如 `.card-header`）或者使用了通用样式（如 `*`, `button`, `div` 的重置样式）。
- 使用了高特异性的选择器，如：`div.card-header { ... }.some-parent .card-header { ... }`
- 用了 `!important` 强制覆盖。
- 通过 JavaScript 动态插入 `<style>` 标签，导致你的插件样式“后加载”，但优先级不够。

**解决：**使用 **Shadow DOM** 让插件 UI 与宿主页面样式隔离







## Canvas相关

### `ctx` 属性配置

---

 **1. 样式相关（颜色与描边）**

| 属性名        | 说明                                              |
| ------------- | ------------------------------------------------- |
| `fillStyle`   | 设置填充颜色/渐变/图案                            |
| `strokeStyle` | 设置描边颜色/渐变/图案                            |
| `lineWidth`   | 线条宽度（默认 1）                                |
| `lineCap`     | 线条端点样式：`butt`（默认）、`round`、`square`   |
| `lineJoin`    | 线条连接处样式：`miter`（默认）、`round`、`bevel` |
| `miterLimit`  | 斜接面限制比例（默认 10）                         |

---

 **2. 阴影属性**

| 属性名          | 说明                   |
| --------------- | ---------------------- |
| `shadowColor`   | 阴影颜色（默认透明黑） |
| `shadowBlur`    | 模糊级别（默认 0）     |
| `shadowOffsetX` | 水平偏移（默认 0）     |
| `shadowOffsetY` | 垂直偏移（默认 0）     |

---

 **3. 字体与文本对齐**

| 属性名         | 说明                                                         |
| -------------- | ------------------------------------------------------------ |
| `font`         | 字体样式（如 `"16px Arial"`）                                |
| `textAlign`    | 水平对齐：`start`（默认）、`end`、`left`、`center`、`right`  |
| `textBaseline` | 垂直对齐：`alphabetic`（默认）、`top`、`middle`、`bottom`、`hanging`、`ideographic` |
| `direction`    | 文本方向：`"ltr"`、`"rtl"`、`"inherit"`（默认）              |

---

 **4. 合成与裁剪**

| 属性名                     | 说明                                                         |
| -------------------------- | ------------------------------------------------------------ |
| `globalCompositeOperation` | 合成操作（如 `"source-over"`、`"multiply"`、`"destination-out"` 等） |
| `globalAlpha`              | 全局透明度（0 到 1，默认 1）                                 |

---

 **5. 图像平滑**

| 属性名                  | 说明                                                      |
| ----------------------- | --------------------------------------------------------- |
| `imageSmoothingEnabled` | 是否开启图像平滑（默认 `true`）                           |
| `imageSmoothingQuality` | 平滑质量：`"low"`、`"medium"`、`"high"`（部分浏览器支持） |

---

 **6. 虚线样式**

| 属性名                  | 说明                         |
| ----------------------- | ---------------------------- |
| `setLineDash(segments)` | 设置虚线样式（如 `[5, 10]`） |
| `lineDashOffset`        | 虚线偏移量（默认 0）         |

---

 **7. 变换矩阵（状态类）**

虽然这些不是“样式”属性，但它们是可配置的状态：
| 属性/方法                        | 说明                            |
| -------------------------------- | ------------------------------- |
| `currentTransform`               | 获取当前变换矩阵（`DOMMatrix`） |
| `setTransform(a, b, c, d, e, f)` | 设置变换矩阵                    |
| `transform(...)`                 | 叠加变换                        |



### `.getImageData()` 和 `.putImageData()`

------

**getImageData** 把画布上的像素“读”出来；  
**putImageData** 把像素数据“写”回去（或写到另一块区域）。

---

1. **getImageData(x, y, width, height)**

返回一个 `ImageData` 对象，里面装着指定矩形区域内 每一个像素的 RGBA 值（0-255 的整数）。  
```javascript
const imgData = ctx.getImageData(50, 50, 200, 100); // 读取 200×100 区域
console.log(imgData.data); // Uint8ClampedArray，长度 = 200×100×4（RGBA）
```
- **用途**：灰度化、反色、滤镜、验证码识别、像素动画、马赛克等。
- **注意**：受 **跨域** 限制；如果画布曾绘制过跨域图片，浏览器会抛 `SecurityError`。

---

**2. putImageData(imagedata, dx, dy [, dirtyX, dirtyY, dirtyWidth, dirtyHeight ])**

把一份 `ImageData` 对象（通常来自 `getImageData` 或你自己 `new ImageData()`）重新绘制到画布上。  
```javascript
// 把刚才读出来的数据原样贴回去
ctx.putImageData(imgData, 50, 50);
// 只贴“脏矩形”——局部更新，性能更好
ctx.putImageData(imgData, 0, 0, 10, 10, 50, 50);
```
- **用途**：像素级动画、撤销/恢复、画笔橡皮擦、游戏地图局部刷新。
- **注意**：不会受 `globalAlpha`、`transform`、`clip`、`shadow` 等影响，直写像素。



### `globalCompositeOperation` 定义像素混合规则

------

`globalCompositeOperation` 是 **Canvas 2D 上下文**的一个属性，用来设置**“新绘制内容”与“已有内容”如何混合/叠加/裁剪**。  
它决定了“画笔”与“画布”之间的像素混合规则，是实现橡皮擦、遮罩、高亮、镂空、混合模式等效果的核心工具

---

**常用模式速查表**

| 模式                   | 效果描述                                 | 记忆口诀       |
| ---------------------- | ---------------------------------------- | -------------- |
| **`source-over`**      | **默认**：新图形盖在旧图形上             | 正常画         |
| **`source-in`**        | 只保留**新旧重叠部分**，其余透明         | 交集-新图颜色  |
| **`source-out`**       | 只保留**新图不与旧图重叠部分**           | 新图挖空       |
| **`source-atop`**      | 新图只画在**旧图像素上**，旧图保留       | 新图被旧图裁剪 |
| **`destination-over`** | 新图**垫在旧图下面**                     | 旧图盖新图     |
| **`destination-in`**   | 只保留**新旧重叠部分**，颜色取旧图       | 交集-旧图颜色  |
| **`destination-out`**  | **橡皮擦**：把旧图**被新图覆盖部分**擦掉 | 新图当橡皮     |
| **`destination-atop`** | 旧图只保留**与新图重叠区域**，新图垫下面 | 旧图被新图裁剪 |
| **`lighter`**          | 颜色**相加变亮**（类似滤色）             | 亮部叠加       |
| **`multiply`**         | 正片叠底，**变暗**                       | 暗部叠加       |
| **`screen`**           | 滤色，**变亮**                           | 亮部叠加       |
| **`overlay`**          | 叠加，**中间调增强对比**                 | 对比增强       |
| **`xor`**              | **异或**：重叠区域透明                   | 镂空           |
| **`copy`**             | **清空画布**，只保留新图                 | 全清再画       |



### `createElementNS` 与 `createElement` 对比

------

关键：**是否指定“命名空间（namespace）”**这决定了浏览器把标签当成什么类型的节点来解析。

|    对比维度    | `createElement`                                              | `createElementNS`                                            |
| :------------: | ------------------------------------------------------------ | ------------------------------------------------------------ |
|    **签名**    | `document.createElement(tagName)`                            | `document.createElementNS(namespace, qualifiedName)`         |
|  **命名空间**  | **总是 HTML** (`http://www.w3.org/1999/xhtml`)               | **自己指定**（SVG、MathML、XHTML…）                          |
|   **返回值**   | `HTMLElement`                                                | 指定命名空间对应的元素（`SVGElement`、`MathMLElement`…）     |
|  **典型用途**  | 创建 `<div>`、`<span>`、`<button>` …                         | 创建 `<svg>`、`<circle>`、`<path>`、`<math>` …               |
|    **示例**    | `document.createElement('div')`                              | `document.createElementNS('http://www.w3.org/2000/svg', 'path')` |
| **写错会怎样** | 少写命名空间时，SVG 元素会被当成 **未知 HTML 标签**，**不会渲染**。 |                                                              |

“只要标签名带 `-` 或属于非 HTML（svg、math），就用 `createElementNS`；普通网页标签用 `createElement` 即可。”



### `willReadFrequently: true` 快速读取canvas

------

**提示：**`Canvas2D: Multiple readback operations using getImageData are faster with the willReadFrequently attribute set to true.  `

------

**定义：**`willReadFrequently: true`并不是 Canvas 2D 规范里正式暴露的属性，它只是一个“悄悄”加到 Chromium 内核里的 hint（性能提示）（非 Chromium 浏览器无效）。  

```js
const ctx = canvas.getContext('2d', { willReadFrequently: true });
```

**作用：**把该 canvas 的底层后端从 GPU 加速纹理 降级成 CPU 内存位图，浏览器会将像素数据缓存起来，以便在后续的读取操作中快速响应。

**应用：**因此只有在 频繁读取像素（每帧一次或几次）且 绘制量不大 时才划算，例如：

- 颜色拾取器、画笔预览、取色放大镜
- 实时阈值/滤镜处理（纯 CPU 算法）
- 生成缩略图、验证码、二维码扫描



### `CanvasRenderingContext2D` API 总结

---

1. **矩形（立刻画）**

- `fillRect(x,y,w,h)`        → 填充实心矩形  
- `strokeRect(x,y,w,h)`      → 描边空心矩形  
- `clearRect(x,y,w,h)`       → 橡皮擦，像素变透明

---

2. **路径（先描述再画）**

- `beginPath()`              → 清空当前路径  
- `moveTo(x,y)`              → 提笔移到起点  
- `lineTo(x,y)`              → 直线连到该点  
- `bezierCurveTo(cp1x,cp1y,cp2x,cp2y,x,y)` → 三次贝塞尔  
- `quadraticCurveTo(cpx,cpy,x,y)`         → 二次贝塞尔  
- `arc(x,y,r,sa,ea,ccw)`     → 画圆弧  
- `arcTo(x1,y1,x2,y2,r)`     → 两切线间圆弧  
- `ellipse(x,y,rx,ry,rot,sa,ea,ccw)` → 椭圆弧  
- `closePath()`              → 回到起点闭合  
- `fill(rule?)`              → 把路径填成实心  
- `stroke()`                 → 把路径描成边  
- `clip(rule?)`              → 把路径当剪刀，后续只画里面  
- `isPointInPath(x,y,fillRule?)` → 判断点是否在路径内  
- `isPointInStroke(x,y)`     → 判断点是否在路径边上

---

3. **文本**

- `fillText(text,x,y,maxW?)`   → 填充文字  
- `strokeText(text,x,y,maxW?)` → 描边文字  
- `measureText(text).width`  → 返回文字宽度（像素）

---

4. **图像**

- `drawImage(img,sx,sy,sw,sh,dx,dy,dw,dh)` → 9 参数重采样，3/5 参数也可

---

5. **像素**

- `getImageData(sx,sy,sw,sh)`  → 把区域像素读成 `ImageData`  
- `putImageData(imData,dx,dy,dirtyX,dirtyW,dirtyH)` → 把像素写回去  
- `createImageData(sw,sh)` 或 `createImageData(existing)` → 新建空白像素块  
- `ImageData.data`            → `Uint8ClampedArray`，RGBA 顺序

---

6. **样式/颜色**

- `fillStyle`                 → 填充颜色/渐变/图案  
- `strokeStyle`               → 描边颜色/渐变/图案  
- `globalAlpha`               → 全局透明度 0-1  
- `globalCompositeOperation`  → 像素混合模式（source-over、multiply 等）

---

7. **线型**

- `lineWidth`                 → 线宽  
- `lineCap`                   → 线头样式 butt/round/square  
- `lineJoin`                  → 拐角样式 miter/round/bevel  
- `miterLimit`                → 尖角长度上限  
- `setLineDash(segments)`     → 设虚线数组  
- `getLineDash()`             → 读虚线数组  
- `lineDashOffset`            → 虚线偏移

---

8. **文本样式**

- `font`                      → 同 CSS font 字符串  
- `textAlign`                 → start/end/left/right/center  
- `textBaseline`              → top/hanging/middle/alphabetic/ideographic/bottom  
- `direction`                 → ltr/rtl/inherit

---

9. **渐变与图案**

- `createLinearGradient(x0,y0,x1,y1)`   → 线性渐变  
- `createRadialGradient(x0,y0,r0,x1,y1,r1)` → 径向渐变  
- `createConicGradient(start,xc,yc)`  → 圆锥渐变（实验）  
- `gradient.addColorStop(offset,color)` → 给渐变加色标  
- `createPattern(img,repetition)`     → 用图片做重复图案

---

10. **阴影**

- `shadowColor`  
- `shadowBlur`  
- `shadowOffsetX`  
- `shadowOffsetY`

---

11. **变换**

- `save()`                    → 把当前状态压栈  
- `restore()`                 → 出栈恢复  
- `reset()`                   → 清空全部状态（实验）  
- `canvas`                    → 反向引用到 `<canvas>`  
- `currentTransform`          → 读/设当前 `DOMMatrix`  
- `setTransform(a,b,c,d,e,f)` 或 `setTransform(matrix)` → 直接设矩阵  
- `transform(a,b,c,d,e,f)`    → 乘上矩阵  
- `translate(x,y)`  
- `rotate(angle)`  
- `scale(x,y)`

---

12. **平滑开关**

- `imageSmoothingEnabled`     → 是否对图像进行平滑缩放  
- `imageSmoothingQuality`     → low/medium/high



### CSS像素 `Vs` 设备像素 `Vs` 位图像素

---

| 概念     | 别名     | 单位    | 谁来决定             | 在代码中的典型值                                             |
| -------- | -------- | ------- | -------------------- | ------------------------------------------------------------ |
| CSS像素  | 逻辑像素 | px      | 开发者写 CSS 时用    | `getBoundingClientRect()` 返回的 200×300                     |
| 设备像素 | 物理像素 | 真·像素 | 屏幕硬件             | 200×300 × 2 = 400×600（DPR=2）`chrome.tabs.captureVisibleTab()` 返回的dataURL位图 |
| 位图像素 | 图片像素 | px      | `canvas`/`ImageData` | `img.width`、`img.height`                                    |







### 错误解决：

#### `Store` 中变量值冲突

------

**问题：**开启画笔功能后拖动面板仍会在面板后面留下笔迹，拖动面板时控制台会打印“graffiti.js.js:282 store.isDragging:  false”但是此时面板还是能跟随鼠标拖动

**原因：**

1. 两个模块各认各的“拖动”标志  
   - `draggablePanel.js` 里把 `store.isDragging` 设为 true 以后，面板就进入拖动逻辑。  
   - `graffiti.js` 里只认自己的 `store.isDragging`——它一旦为 false，就以为“用户没在拖动，可以下笔”。  
   结果：面板拖动期间，涂鸦模块仍然把鼠标事件当成“在画布上画画”来处理，于是留下笔迹。

2. 打印的那句日志  
   你在 `graffiti.js` 里 `console.log('store.isDragging: ', store.isDragging);`  
   打印的是**涂鸦模块自己**的 `store.isDragging`，它当然一直是 false（涂鸦模块自己从来没把那个变量设成 true），所以控制台看起来“矛盾”。

3. 根本问题  
   面板拖动开始时，**必须让涂鸦模块完全收不到鼠标事件**，否则它一定会画线。  
   靠“变量判断”去区分“到底是拖动还是画画”永远有 race-condition，最省事的办法就是让事件根本到不了涂鸦层。

------------------------------------------------
解决办法（任选其一，推荐方案 1）

方案 1：拖动期间让画布“点不透”  
在 `draggablePanel.js` 里加两行即可：

```javascript
// 拖动开始
panelDiv.addEventListener('mousedown', (e) => {
  isMoved = false;
  store.isDragging = true;
  // 让涂鸦画布收不到事件
  const canvas = document.getElementById('graffiti-canvas');
  if (canvas) canvas.style.pointerEvents = 'none';

  offsetX = e.clientX - panelDiv.offsetLeft;
  offsetY = e.clientY - panelDiv.offsetTop;
  document.body.style.userSelect = 'none';
});

// 拖动结束
document.addEventListener('mouseup', () => {
  store.isDragging = false;
  // 恢复画布可画
  const canvas = document.getElementById('graffiti-canvas');
  if (canvas) canvas.style.pointerEvents = 'auto';

  document.body.style.userSelect = '';
});
```

这样面板拖动时，鼠标事件被 `graffiti-canvas` 忽略，自然不会再留笔迹。

方案 2：把“全局拖动”状态收敛到同一个 `store.isDragging`  
如果你希望只靠变量判断，那就让 `graffiti.js` 里所有“能不能画”的判断都**只依赖** `store.isDragging`，而 `draggablePanel.js` 在拖动期间**不要释放** `store.isDragging = false`，直到 `mouseup` 再置回 false。  
但这样仍有可能在快速拖动时漏掉一两帧，不如方案 1 彻底。

------------------------------------------------
一句话总结  
面板拖动时把 `graffiti-canvas` 的 `pointerEvents` 设成 `none`，让画布直接“失焦”，就再也不会“拖一路画一路”了。



#### 没有调用 `MoveTo` 但线条仍从新位置出发

------

**原因：**没有调用 `beginPath()`，Canvas会把所有 `moveTo` 和 `lineTo` 都当作同一个路径的一部分。即使你没有显式调用 `moveTo`，如果之前的路径还在，Canvas可能仍然在使用之前的起点。

**解决：**使用 `beginPath()`开始一个新的路径并清除之前所有的子路径（moveTo, lineTo, arc等）

### 







## 性能监控和优化

### 动画优化

------

**改动：**
将 left/top 的定位方式替换为 transform，并在 CSS 中类添加 will-change: transform

**原因：**

- 使用 transform 替代 left/top：可以让浏览器只在合成层上移动元素，而不需要触发布局（reflow）和重绘（repaint），大幅减少计算量，动画更流畅。
- will-change: transform 告诉浏览器该属性会频繁变化，浏览器会提前为该元素分配独立的合成层，进一步避免不必要的重排和重绘，提升响应速度和动画性能。



### 合成层

------

**定义：**
合成层（Compositor Layer）是浏览器渲染管线里的一个独立画布，简单说：
浏览器把网页拆成若干层，每层单独画好，再像 PS 一样一次性合成到屏幕上。
只要这一层里的内容不改变，后续帧就直接复用这张小画布，只移动/缩放/淡入淡出这张画布，从而跳过重新绘制和布局。

------

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



### 布局抖动

> 浏览器在 **短时间内反复读取 → 写入 → 读取 → 写入……** 布局属性，导致被迫 **连续强制同步布局**，从而引发 **性能雪崩** 的现象。
>
> **注意：**通过 JS 读取某个 DOM 元素的宽高等属性时也会引起元素重排

---

 **关键问题：强制同步布局**

- **正常流程**：JS → 浏览器异步等一会 → 统一做一次 Layout。  
- **触发强制同步布局**：你在 **同一帧里** 先 **读** 一个布局属性，再 **写** 一个样式，再 **读** 同一个（或相关）布局属性。  
  浏览器为了给你 最新值，必须 立即停下 JS，先计算 Layout，再继续执行 JS。  
  如果这发生在循环里 → 每轮都强制布局 → 爆炸。

---

 **如何检测布局抖动**

**① DevTools Performance 面板**  

录制时看到 大量紫色（Layout）条，且右上角出现 红色三角形 → 强制同步布局警告。

**② Lighthouse / CLS**  

- CLS（Cumulative Layout Shift） 高，可能伴随抖动。  
- 诊断项 “Avoid large layout shifts” 或 “Avoid forced synchronous layouts”。

---

 **解决方案（最佳实践）**

| 策略                | 代码示例                                                | 效果          |
| ------------------- | ------------------------------------------------------- | ------------- |
| **批量读 → 批量写** | 先统一读所有值到数组，再统一写样式                      | 1 次布局      |
| **离线操作**        | 用 `documentFragment` 或 `display:none` 脱离文档流修改  | 0 次布局      |
| **缓存值**          | 把 `offsetTop` 缓存到变量，避免重复读                   | 减少强制布局  |
| **RAF 去抖**        | 把写操作放进 `requestAnimationFrame` 队列，下一帧统一写 | 最多 1 次布局 |
| **CSS 替代 JS**     | 尽可能用 `transform`、`opacity` 合成层属性              | 跳过 Layout   |

---

 **速查表：会触发强制布局（重排）的常用属性**

| 读操作（会触发）              | 写操作（会使缓存失效）                                |
| ----------------------------- | ----------------------------------------------------- |
| `offsetTop/Left/Width/Height` | 改变 `width`、`height`、`margin`、`padding`、`border` |
| `clientTop/Left/Width/Height` | 改变 `font-size`、`line-height`                       |
| `scrollTop/Left/Width/Height` | 改变 `content` 文本                                   |
| `getComputedStyle()`          | 添加/删除样式类                                       |
| `getBoundingClientRect()`     | 改变 `display`、`position`、`top/left`                |



### Chrome DevTools Performance性能面板 

--------------------------------------------------
1. **三图：FPS、CPU、NET（最顶上的三行**）
--------------------------------------------------
1) **FPS（帧率图）**  
   - 绿色竖条越高 = 帧率越高；**红色块** = 帧掉到底了，用户肉眼可见卡顿。  
   - 60 FPS 对应 16.6 ms/帧，低于 30 FPS 基本必卡。

2) **CPU（面积图）**  
   - 颜色与 Summary 标签页完全一致：  
     – 蓝色 Loading：HTML/字节下载 + 解析  
     – 黄色 Scripting：JS 编译 + 执行  
     – 紫色 Rendering：样式重算、布局（Reflow）  
     – 绿色 Painting：重绘、合成（Paint）  
     – 灰色 Other：垃圾回收、浏览器内务  
     – 白色 Idle：主线程完全空闲  
   - 图被颜色塞满 → CPU 跑满，长时间空白 → 还有优化空间。

3) **NET（网络瀑布）**  
   - 每根横条 = 一个资源，从左到右是发送 → 等待 → 下载；**越高并发条数越多**可看出是否受 HTTP/1.1 6 连接上限卡住。  
   - 悬停可看到此刻屏幕截图，用来对照“白屏”“出现内容”时间点。

--------------------------------------------------
2. **两表：Summary、Timing**
--------------------------------------------------
1) **Summary**（选中一段区间才出现）  
   把上面 CPU 面积图量化成毫秒数，一眼看出“JS 耗时还是渲染耗时”。

2) **Timing**（虚线竖条）  
   常用 6 条：  
   - FP（First Paint）  
   - FCP（First Contentful Paint）  
   - FMP/LCP（First/Largest Contentful Paint，新版已合并为 LCP）  
   - DCL（DOMContentLoaded）  
   - L（onLoad）  
   位置越靠左 = 用户越早看到东西；和 FPS 图一起看，可判断“首屏虽然快但帧率掉得一塌糊涂”这类场景。

--------------------------------------------------
3. **一火焰：Main Thread**
--------------------------------------------------
- 横轴时间，纵轴调用栈；**宽块 = 长任务**。  
- 右上角出现红色小三角 → 触发“强制同步布局”或“长任务 (>50 ms)”，点块可在 Bottom-Up/Call Tree 里看具体代码行号。  
- 常见优化目标：  
  – 长 JS 任务 → 拆分、Web Worker  
  – 高紫色条 → 减少 DOM 数量、缓存 offsetTop 等  
  – 高绿色条 → 改用 transform/opacity 合成属性

--------------------------------------------------
4. **Frames、Raster、GPU**
--------------------------------------------------
- Frames：每帧的耗时，直接对应 FPS 图，选中某帧可看“这一 16 ms 究竟花在哪儿”。  
- Raster & GPU：底层光栅化与 GPU 进程，**普通页面优化一般不需要碰**，遇到 canvas/WebGL 掉帧再关注。

--------------------------------------------------
5. **内存 & 截图行**
--------------------------------------------------
- HEAP：JS 堆大小，**持续上升不下降** = 疑似泄漏；可在 Memory 面板打快照确认。  
- Screenshots：默认勾选，拖动时间轴可看到“用户那一刻到底看到什么”，用来对齐 FP/FCP 非常直观。





###  Core Web Vitals（核心网页指标）

---

| 指标    | 全称                      | 衡量维度       | 良好标准 | 含义一句话                         |
| ------- | ------------------------- | -------------- | -------- | ---------------------------------- |
| **LCP** | Largest Contentful Paint  | **加载性能**   | ≤2.5 s   | 用户多久能看到“最大块”主要内容     |
| **INP** | Interaction to Next Paint | **交互响应**   | ≤200 ms  | 用户点按钮后，多久能看到页面“反应” |
| **CLS** | Cumulative Layout Shift   | **视觉稳定性** | ≤0.1     | 页面元素是否“跳动”或“乱移位”       |

---

1. **LCP（最大内容绘制时间）**

- **定义**：从页面开始加载到 **视口内最大元素（图片、视频、大段文本）完全渲染** 的时间。  
- **举例**：打开一篇文章，首屏大图或标题文本块出现的时间就是 LCP。  
- **优化方向**：
  - 压缩/预加载关键图片  
  - 使用 CDN 加速  
  - 减少阻塞渲染的 JS/CSS

2. **INP（交互至下一次绘制）**

- **定义**：用户 **首次点击、触摸、按键** 后，页面 **下一次视觉更新** 所需的 **最长时间**（取整页生命周期内最差的一次，忽略离群值）。  
- **举例**：点“加入购物车”按钮，按钮状态变化/弹框出现的延迟就是 INP。  
- **优化方向**：
  - 减少主线程长任务（拆分 JS）  
  - 用 Web Worker 做重计算  
  - 避免同步 DOM 操作

**3. CLS（累积布局偏移）**

- **定义**：页面 **整个生命周期内** 所有 **意外布局偏移** 的得分总和（0 表示完全稳定）。  
- **举例**：文字加载完突然插入一张没设高度的图，导致 按钮被挤下去，用户点错 —— 这就是高 CLS。  
- **优化方向**：
  - 给图片/视频设 明确宽高 或 `aspect-ratio`  
  - 避免动态插入内容无占位  
  - 用 CSS `transform` 做动画，避免改变布局



## 项目发布与部署










------

**问题：**

**原因：**

**解决：**





### 实现思路（简要）
- 启用“滚动长截图”后，在视口下方固定位置插入一条“水平终止线”与其上方的提示文字“点击任意位置结束截屏”。页面以 requestAnimationFrame 进行平滑缓慢下滚。
- 用户点击任意位置即刻停止；停止瞬间用“终止线”的当前位置作为长图的“终止坐标”，而“起始坐标”为功能启用时页面的顶端。
- 在滚动过程中周期性获取多张视口截图，每张记录其对应的 `scrollY`。结束后将所有截图按与目标区间的交集进行裁剪，再顺序拼接生成最终长图。
- 为保证最终截图中不包含“终止线”和“提示文字”，在每次截屏前临时隐藏这两个提示元素，截完再显示（用户不会感觉明显闪烁）。
- 不禁用页面点击（允许用户点击结束）；只临时禁止文字选中防止误选中。
- 设备像素比（DPR）差异：裁剪与合并均使用当前 DPR 做 CSS 坐标→设备像素坐标转换，避免拼接产生缝隙或锯齿。
- 完成后将结果复制到剪贴板并触发下载，恢复 UI 与交互。

### 相关代码（对 `src/features/tools/screenshot.js` 的补充/修改）

以下是替换并补全的 `scrollScreenshot` 与 `combineImages`，以及滚动流程用到的少量辅助逻辑。请将对应函数整体替换为下列版本。

```js
//滚动截屏相关
async function scrollScreenshot() {
	let startScrollTop = window.scrollY; // 启用时的页面顶端（CSS像素）
	let userStopped = false;
	let rafId = null;
	let lastCaptureY = -Infinity;
	const dpr = window.devicePixelRatio || 1;
	const viewportWidth = window.innerWidth;
	const viewportHeight = window.innerHeight;

	// 每次抓图的最小滚动增量，避免抓太多帧（越小越细腻，越大越省资源）
	const minDeltaForCapture = Math.floor(viewportHeight * 0.9);

	// 收集的视口截图
	const shots = []; // { img: dataURL, y: scrollYAtShot }

	// 构造或复用提示与终止线
	if(!stopIndicator){
		stopIndicator = createEl('div',{class: 'stop-indicator'});
		// 基础内联样式，确保即使样式文件未加载也能正常显示
		stopIndicator.style.position = 'fixed';
		stopIndicator.style.left = '0';
		stopIndicator.style.right = '0';
		stopIndicator.style.height = '2px';
		stopIndicator.style.background = 'rgba(255,0,0,0.9)';
		stopIndicator.style.zIndex = '2147483647';
		stopIndicator.style.pointerEvents = 'none';
	}
	if(!stopText){
		stopText = createEl('div',{class: 'stop-text', textContent: chrome.i18n.getMessage('screenshotTooltip') || '点击任意位置结束截屏'});
		stopText.style.position = 'fixed';
		stopText.style.left = '50%';
		stopText.style.transform = 'translateX(-50%)';
		stopText.style.color = '#fff';
		stopText.style.fontSize = '14px';
		stopText.style.padding = '6px 10px';
		stopText.style.background = 'rgba(0,0,0,0.6)';
		stopText.style.borderRadius = '4px';
		stopText.style.zIndex = '2147483647';
		stopText.style.pointerEvents = 'none';
	}
	// 终止线位于视口靠下（例如 85% 高度）
	const lineY = Math.round(viewportHeight * 0.85);
	stopIndicator.style.top = `${lineY}px`;
	// 提示文字在终止线上方
	stopText.style.top = `${Math.max(8, lineY - 28)}px`;

	// 挂载到 shadowRoot
	shadowRoot.append(stopIndicator, stopText);
	stopIndicator.style.display = 'block';
	stopText.style.display = 'block';

	// 不屏蔽点击，允许用户点击结束；仅禁用选中文本
	const prevUserSelect = document.body.style.userSelect;
	document.body.style.userSelect = 'none';

	// 点击即结束
	const onStopClick = () => {
		userStopped = true;
	};
	// 使用一次性原生监听，避免重复绑定
	document.addEventListener('click', onStopClick, { once: true, capture: true });

	// 截取一帧（隐藏提示元素，截完再恢复显示）
	const grabViewport = async () => {
		const prevLineDisplay = stopIndicator.style.display;
		const prevTextDisplay = stopText.style.display;
		stopIndicator.style.display = 'none';
		stopText.style.display = 'none';
		// 双 rAF 确保样式生效后再截图
		await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
		const response = await chrome.runtime.sendMessage({type:'SCREENSHOT'});
		const img = response?.image;
		// 恢复显示
		stopIndicator.style.display = prevLineDisplay;
		stopText.style.display = prevTextDisplay;
		return img;
	};

	// 初始立即截第一帧
	shots.push({
		img: await grabViewport(),
		y: window.scrollY
	});
	lastCaptureY = window.scrollY;

	// 平滑慢速滚动
	const scrollStep = Math.max(1, Math.floor(viewportHeight / 180)); // 约 ~180 帧滚完一屏，较慢
	const tick = async () => {
		if(userStopped){
			cancelAnimationFrame(rafId);
			return finish();
		}
		// 若已至底部，则也结束
		const atBottom = Math.ceil(window.scrollY + viewportHeight) >= document.documentElement.scrollHeight;
		if(atBottom){
			userStopped = true;
			cancelAnimationFrame(rafId);
			return finish();
		}

		// 向下滚动一点
		window.scrollTo({ top: window.scrollY + scrollStep, behavior: 'auto' });

		// 满足最小增量时抓图
		if(window.scrollY - lastCaptureY >= minDeltaForCapture){
			const img = await grabViewport();
			shots.push({ img, y: window.scrollY });
			lastCaptureY = window.scrollY;
		}

		rafId = requestAnimationFrame(tick);
	};

	rafId = requestAnimationFrame(tick);

	// 结束与导出
	async function finish(){
		// 结束瞬间以当前滚动位置 + 终止线的视口内位置作为终点
		const stopY = window.scrollY + lineY;
		const startY = startScrollTop;

		// 确保包含最后一张（可能停在两次抓图之间）
		const lastImg = await grabViewport();
		shots.push({ img: lastImg, y: window.scrollY });

		// 清理 UI
		stopIndicator.style.display = 'none';
		stopText.style.display = 'none';
		document.body.style.userSelect = prevUserSelect || '';
		document.removeEventListener('click', onStopClick, { capture: true });

		// 过滤并裁剪各段和区间交集
		const chunks = []; // { img: dataURL, h: cssHeight }
		for(const s of shots){
			const top = s.y;
			const bottom = s.y + viewportHeight;
			// 与 [startY, stopY] 的交集
			const interTop = Math.max(startY, top);
			const interBottom = Math.min(stopY, bottom);
			const interH = Math.max(0, interBottom - interTop);
			if(interH <= 0) continue;

			const cropYInViewport = interTop - top; // 在该截图中的起点（CSS 像素）
			const cropInfos = {
				x: 0,
				y: Math.round(cropYInViewport),
				w: viewportWidth,
				h: Math.round(interH)
			};
			// 裁剪
			// 使用已有的 cropImg（内部已做 DPR 转换与边界修正）
			// 注意：这里 x/y/w/h 都是 CSS 像素
			// eslint-disable-next-line no-await-in-loop
			const cropped = await cropImg(s.img, cropInfos);
			chunks.push({ img: cropped, h: cropInfos.h });
		}

		// 合并
		const result = await combineImages(chunks, dpr, viewportWidth);
		// 完成：复制并下载
		copyImg(result);
		downloadImg(result);

		// 恢复面板与状态
		restorePageInteraction();
		store.updateState();
		panelDiv.style.visibility = 'visible';
	}
}
```

```js
// 新的合并：按顺序纵向拼接
async function combineImages(chunks, dpr, viewportWidth){
	return new Promise((resolve, reject) => {
		try{
			// chunks: [{ img: dataURL, h: cssHeight }]
			// 先把所有图片对象加载出来，避免异步 draw 时序问题
			const imgs = [];
			let loaded = 0;
			for(let i=0;i<chunks.length;i++){
				const im = new Image();
				im.onload = () => {
					imgs[i] = im;
					loaded++;
					if(loaded === chunks.length){
						// 计算目标画布大小（设备像素）
						const widthCSS = viewportWidth;
						const heightCSS = chunks.reduce((acc, c) => acc + c.h, 0);
						const widthDev = Math.max(1, Math.round(widthCSS * dpr));
						const heightDev = Math.max(1, Math.round(heightCSS * dpr));

						const canvas = document.createElement('canvas');
						canvas.width = widthDev;
						canvas.height = heightDev;
						const ctx = canvas.getContext('2d');
						ctx.imageSmoothingEnabled = false;

						// 逐段绘制
						let offsetCSS = 0;
						for(let j=0;j<chunks.length;j++){
							const drawHDev = Math.round(chunks[j].h * dpr);
							ctx.drawImage(
								imgs[j],
								0, 0, imgs[j].naturalWidth, imgs[j].naturalHeight,
								0, Math.round(offsetCSS * dpr), widthDev, drawHDev
							);
							offsetCSS += chunks[j].h;
						}
						resolve(canvas.toDataURL('image/png'));
					}
				};
				im.onerror = () => reject(new Error('image load failed'));
				im.src = chunks[i].img;
			}
			if(chunks.length === 0){
				// 空结果保护
				const canvas = document.createElement('canvas');
				canvas.width = Math.round(viewportWidth * dpr);
				canvas.height = 1;
				resolve(canvas.toDataURL('image/png'));
			}
		}catch(e){
			reject(e);
		}
	});
}
```

说明：
- `scrollScreenshot` 实现了提示/终止线显示、rAF 平滑滚动、分段抓图、点击结束、裁剪拼接、复制下载、UI 恢复的完整流程。
- 每次截屏前临时隐藏 `stopIndicator` 与 `stopText`，因此最终图片不会包含它们。
- `combineImages` 新增重载函数，按 DPR 拼接，避免拉伸失真。
- 未调用 `preventPageInteraction()`，只禁用文本选中，确保用户可以点击结束。

- 你已有的样式文件（`public/styles/base.css`, `public/styles/screenshot.css`）里如已定义了 `.stop-indicator`/`.stop-text`，上述内联样式不会冲突；如未定义，也能依靠内联样式正常工作。

- 若你希望调整滚动速度，可调 `scrollStep` 或 `minDeltaForCapture` 两个常量。

- 该实现依赖现有的消息 `SCREENSHOT` 能返回当前视口截图，与现有 `cropImg`、`copyImg`、`downloadImg` 保持兼容。

- 终止线位置为视口高度 85% 处，符合“页面中下方”；如需精确到某固定 px，可替换 `lineY` 的计算。

- 若你希望进一步减少内存占用，可在裁剪出段后释放 `shots` 的原始大图，但通常在页面内一次操作足够安全。

- 由于我们使用原生 `addEventListener('click', { once: true, capture: true })`，不会造成多次启用时的重复绑定问题。


- 我已补充并替换了 `scrollScreenshot` 与 `combineImages` 的实现，新增了滚动抓图、点击终止、按区间裁剪并拼接输出的完整流程。
