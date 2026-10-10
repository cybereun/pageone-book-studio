import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';
export default defineConfig({ base: './', plugins: [react()], build: { rollupOptions: { input: { main: resolve('index.html'), preview: resolve('preview.html') } } }, server: { port: 5178, strictPort: true } });
