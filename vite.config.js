import { defineConfig } from 'vite';

export default defineConfig({
    build: {
        watch: {
            exclude: 'node_modules/**',
            clearScreen: true,
        },
        rollupOptions: {
            // https://rollupjs.org/configuration-options/
        },
    },
})