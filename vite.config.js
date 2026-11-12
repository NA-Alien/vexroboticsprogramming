import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { securityHeaders } from './config/security-headers.js';
import { pagePaths } from './src/lib/metadata.js';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function staticPreview() {
  const pages = new Set(pagePaths);
  return {
    name: 'static-page-preview',
    configurePreviewServer(server) {
      server.middlewares.use((request, response, next) => {
        const path = new URL(request.url, 'http://localhost').pathname;
        if (pages.has(path) || pages.has(`${path}/`) || /\.[^/]+$/.test(path) && !path.endsWith('.html')) return next();
        response.writeHead(404, { ...securityHeaders, 'Content-Type': 'text/html; charset=utf-8' });
        response.end(request.method === 'HEAD' ? '' : readFileSync(resolve(server.config.root, server.config.build.outDir, '404.html')));
      });
    }
  };
}

export default defineConfig(({ isPreview }) => ({
  appType: isPreview ? 'mpa' : 'spa',
  plugins: [react(), staticPreview()],
  build: { sourcemap: false },
  server: { host: '127.0.0.1', fs: { strict: true } },
  preview: { host: '127.0.0.1', headers: securityHeaders }
}));
