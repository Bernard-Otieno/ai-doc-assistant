import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'https://api.languagetool.org/v2', //  API URL
        changeOrigin: true,
        secure: false, // using HTTPS API
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
});
