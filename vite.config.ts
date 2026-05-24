import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: 'index.html',
        enemyLab: 'enemy-lab.html'
      }
    }
  },
  server: {
    host: '127.0.0.1',
    port: 5174,
    strictPort: true
  }
});
