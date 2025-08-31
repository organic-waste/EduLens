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

### 

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

2. 找到插件，点击"检查视图"中的 background page

#### 日志调试

​	使用 chrome.storage 调试：

```js
chrome.storage.sync.get('settings', (data) => {
  console.log('当前设置:', data)
})
```




## Typescript相关



## 项目发布与部署


#### 提交项目时github连接失败

**解决：**
```
git config --global http.proxy  http://127.0.0.1:7890
git config --global https.proxy http://127.0.0.1:7890
```