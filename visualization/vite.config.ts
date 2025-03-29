import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@data': path.resolve(__dirname, '../data'),
    },
  },
  server: {
    // 静的ファイルをルートディレクトリからも提供
    fs: {
      allow: ['..']
    }
  },
  // 標準のpublicディレクトリ
  publicDir: path.resolve(__dirname, 'public'),
})
