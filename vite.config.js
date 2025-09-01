import { defineConfig } from 'vite';
import { crx } from '@crxjs/vite-plugin';
import manifest from './manifest.json';

export default defineConfig({
  plugins: [crx({ manifest })],
  build: {
    rollupOptions: {
      input: {
        content: 'src/content-script.js',
        background: 'src/background.js',
        popup: 'src/popup.html',
        styles: 'src/style.css'
      },
    }
  }
});
