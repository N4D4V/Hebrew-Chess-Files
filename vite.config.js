import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
    plugins: [

    ],
    build: {
        cssCodeSplit: false,
        assetsDir: '',
        rollupOptions: {
            input: {
                content: resolve(__dirname, 'src/content.js'),
                popup: resolve(__dirname, 'src/popup.js')
            },
            output: {
                entryFileNames: '[name].js',
                assetFileNames: '[name][extname]'
            }
        },
        outDir: 'dist',
        emptyOutDir: true
    }
})
