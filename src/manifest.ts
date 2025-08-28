import { defineManifest } from '@crxjs/vite-plugin'

export default defineManifest({
  manifest_version: 3,
  name: 'EduLens 鼠标增强',
  version: '1.0.0',
  description: '网课辅助教学浏览器插件',
  permissions: ['storage', 'activeTab'],
  action: {
    default_popup: 'src/popup/index.html',
    default_icon: {
      16: 'icons/icon16.png',
      48: 'icons/icon48.png',
      128: 'icons/icon128.png'
    }
  },
  content_scripts: [
    {
      matches: ['<all_urls>'],
      js: ['src/content-scripts/main.ts'],
      css: ['src/assets/styles/main.scss']
    }
  ],
  background: {
    service_worker: 'src/background/background.ts'
  },
  icons: {
    16: 'icons/icon16.png',
    48: 'icons/icon48.png',
    128: 'icons/icon128.png'
  }
})