import { createApp } from 'vue';
import { createPinia } from 'pinia';
import MouseHighlight from '@/components/content/MouseHighlight.vue';
import Spotlight from '@/components/content/Spotlight.vue';
import Magnifier from '@/components/content/Magnifier.vue';
import DrawingBoard from '@/components/content/DrawingBoard.vue';
import Whiteboard from '@/components/content/Whiteboard.vue';
import ChapterNav from '@/components/content/ChapterNav.vue';
import Countdown from '@/components/content/Countdown.vue';

// 创建应用实例
const app = createApp({});
const pinia = createPinia();
app.use(pinia);

// 挂载各个功能组件
const mountComponent = (Component, id) => {
  const container = document.createElement('div');
  container.id = id;
  document.body.appendChild(container);
  const instance = createApp(Component);
  instance.use(pinia);
  instance.mount(container);
};

// 初始化所有功能组件
mountComponent(MouseHighlight, 'edulens-mouse-highlight');
mountComponent(Spotlight, 'edulens-spotlight');
mountComponent(Magnifier, 'edulens-magnifier');
mountComponent(DrawingBoard, 'edulens-drawing-board');
mountComponent(Whiteboard, 'edulens-whiteboard');
mountComponent(ChapterNav, 'edulens-chapter-nav');
mountComponent(Countdown, 'edulens-countdown');

// 监听来自 popup 的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'toggleFeature') {
    // 处理功能开关逻辑
    sendResponse({ success: true });
  }
});
