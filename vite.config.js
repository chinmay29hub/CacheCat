import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import { copyFileSync, existsSync, mkdirSync } from 'fs';

export default defineConfig({
  plugins: [
    react(),
    viteStaticCopy({
      targets: [
        { src: 'manifest.json', dest: '.' },
        { src: 'icons/*.png', dest: 'icons' },
      ],
    }),
    {
      name: 'copy-background-agent',
      closeBundle() {
        // Copy background and agent to dist root
        const distDir = resolve(__dirname, 'dist');
        if (!existsSync(distDir)) {
          mkdirSync(distDir, { recursive: true });
        }
        const bgSrc = resolve(__dirname, 'src/background/background.js');
        const agentSrc = resolve(__dirname, 'src/agent/agent.js');
        const contentSrc = resolve(__dirname, 'src/content/content.js');
        const bgDest = resolve(distDir, 'background.js');
        const agentDest = resolve(distDir, 'agent.js');
        const contentDest = resolve(distDir, 'content.js');

        if (existsSync(bgSrc)) {
          copyFileSync(bgSrc, bgDest);
          console.log('Copied background.js to dist');
        }
        if (existsSync(agentSrc)) {
          copyFileSync(agentSrc, agentDest);
          console.log('Copied agent.js to dist');
        }
        if (existsSync(contentSrc)) {
          copyFileSync(contentSrc, contentDest);
          console.log('Copied content.js to dist');
        }

        // Move dashboard.html to dist root
        const dashboardSrc = resolve(distDir, 'src/dashboard/dashboard.html');
        const dashboardDest = resolve(distDir, 'dashboard.html');
        if (existsSync(dashboardSrc)) {
          copyFileSync(dashboardSrc, dashboardDest);
          console.log('Moved dashboard.html to dist root');
        }
      },
    },
  ],
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        dashboard: resolve(__dirname, 'src/dashboard/dashboard.html'),
      },
      output: {
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          if (assetInfo.name === 'dashboard.html') {
            return 'dashboard.html';
          }
          return 'assets/[name]-[hash].[ext]';
        },
      },
    },
    copyPublicDir: false,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: false,
      },
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
});
