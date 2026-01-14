import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
    root: '.',
    publicDir: 'public',
    build: {
        outDir: 'dist',
        emptyOutDir: true
    },
    server: {
        port: 5173,
        open: true,
        // Serve files from parent data directory
        fs: {
            allow: ['..']
        }
    },
    // Resolve aliases for data access
    resolve: {
        alias: {
            '@data': path.resolve(__dirname, '../data')
        }
    }
});
