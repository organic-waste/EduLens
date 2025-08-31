import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import manifest from './src/manifest.js';
import { crx } from '@crxjs/vite-plugin';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    crx({ manifest })
  ],
  build: {
    rollupOptions: {
      input: {
        popup: 'src/popup/index.html',
        content: 'src/content-scripts/main.js',
        background: 'src/background/background.js'
      }
    }
  },
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `@import "@/assets/styles/variables.scss";`
      }
    }
  },
  resolve: {
    alias: {
      '@': '/src'
    }
  }
});
