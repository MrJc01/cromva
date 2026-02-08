import { defineConfig } from 'vite';

export default defineConfig({
    root: 'app',
    build: {
        outDir: '../dist',
        emptyOutDir: true,
    },
    server: {
        port: 8080,
        strictPort: true,
    },
});
