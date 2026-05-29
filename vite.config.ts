import { defineConfig } from 'vite';
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig(({ mode }) => ({
  plugins:
    mode === 'analyze'
      ? [
          visualizer({
            filename: 'artifacts/bundle/stats.html',
            template: 'treemap',
            gzipSize: true,
            brotliSize: true
          })
        ]
      : [],
  build: {
    rollupOptions: {
      input: {
        main: 'index.html'
      },
      output: {
        manualChunks(id) {
          const normalized = id.replace(/\\/g, '/');
          if (normalized.includes('/src/systems/debug/') || normalized.includes('/src/ui/debugMenu')) {
            return 'debug-tools';
          }
          if (normalized.includes('/src/systems/assetForge') || normalized.includes('/src/data/forgeAssetRegistry')) {
            return 'asset-forge';
          }

          return undefined;
        }
      }
    }
  },
  server: {
    host: '127.0.0.1',
    port: 5174,
    strictPort: true
  }
}));
