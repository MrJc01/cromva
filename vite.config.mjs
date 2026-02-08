import { defineConfig } from 'vite';
import { viteStaticCopy } from 'vite-plugin-static-copy';

export default defineConfig({
    root: 'app',
    base: './', // Ensure relative paths for assets
    build: {
        outDir: '../dist',
        emptyOutDir: true,
        rollupOptions: {
            input: {
                main: 'app/index.html',
            },
        },
    },
    plugins: [
        viteStaticCopy({
            targets: [
                {
                    src: 'css',
                    dest: '.'
                },
                {
                    src: 'js',
                    dest: '.'
                },
                {
                    src: 'scripts',
                    dest: '.'
                }
            ]
        })
    ],
    server: {
        port: 8080,
        strictPort: true,
    },
});
