import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { reservationsApi } from './dev/reservationsApiPlugin'

export default defineConfig({
  plugins: [react(), reservationsApi()],
  server: {
    port: 5173,
  },
})
