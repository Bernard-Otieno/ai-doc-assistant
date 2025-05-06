// vite.config.js
import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'https://api.languagetool.org/v2', // Your API URL
        changeOrigin: true,
        secure: false, // If using HTTPS API
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
});
