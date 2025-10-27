import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import { viteStaticCopy } from 'vite-plugin-static-copy'
import { resolve } from 'path'

// https://vite.dev/config/
export default defineConfig({
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  plugins: [vue(),
             tailwindcss(),
             viteStaticCopy({
              targets: [
                { 
                  src: 'src/assets/images/*', 
                  dest: 'assets/images' 
                }
              ]
            })
          ],
          build: {
            assetsDir: 'assets',
            outDir: 'dist',
            rollupOptions: {
              output: {
                assetFileNames: 'assets/[name]-[hash][extname]'
              }
            }
          }
})
