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

### 调试方法



## Typescript相关
