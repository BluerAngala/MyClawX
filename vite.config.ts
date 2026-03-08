import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import electron from 'vite-plugin-electron';
import renderer from 'vite-plugin-electron-renderer';
import { nodeExternals } from 'rollup-plugin-node-externals';
import { resolve } from 'path';

export default defineConfig({
  plugins: [
    react(),
    electron([
      {
        entry: 'electron/main/index.ts',
        onstart(options) {
          options.startup();
        },
        vite: {
          plugins: [
            nodeExternals({
              builtins: true,
              deps: true,
              devDeps: true,
              optDeps: true,
              peerDeps: true,
            }),
          ],
          build: {
            outDir: 'dist-electron/main',
            sourcemap: true,
            minify: process.env.NODE_ENV === 'production',
          },
        },
      },
      {
        entry: 'electron/preload/index.ts',
        onstart(options) {
          options.reload();
        },
        vite: {
          plugins: [nodeExternals()],
          build: {
            outDir: 'dist-electron/preload',
            sourcemap: true,
            minify: process.env.NODE_ENV === 'production',
          },
        },
      },
    ]),
    renderer(),
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@electron': resolve(__dirname, 'electron'),
    },
  },
  server: {
    port: 6388,
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
});
