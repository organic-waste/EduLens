import { createApp } from 'vue';
import { createPinia } from 'pinia';

// 创建应用实例
const app = createApp({});
const pinia = createPinia();
app.use(pinia);

