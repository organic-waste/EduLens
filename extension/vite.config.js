import { defineConfig } from 'vite';
import { crx } from '@crxjs/vite-plugin';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import manifest from './manifest.json';

export default defineConfig({
  plugins: [
    crx({ manifest }),
    viteStaticCopy({
      targets: [
        {
          src: 'public/styles/*',
          dest: 'styles'
        }
      ]
    })
  ],
  build: {
    rollupOptions: {
      input: {
        content: 'src/content-script.js',
        background: 'src/background.js',
        popup: 'src/popup.html',
      },
    }
  }
});
