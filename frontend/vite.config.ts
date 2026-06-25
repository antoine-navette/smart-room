/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [react()],
    server: {
        host: true,
        watch: {
            usePolling: true,
            interval: 300,
        },
        hmr: {
            host: 'localhost',
        },
    },
    test: {
        globals: true,
        environment: 'jsdom',
        setupFiles: './src/test/setup.ts',
        css: true,
        coverage: {
            provider: 'v8',
            reporter: ['text', 'html'],
            reportsDirectory: './coverage',
        },
    },
});
