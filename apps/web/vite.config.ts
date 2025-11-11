import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    // Proxy removed - using direct API URLs from environment variables
    // Development: http://localhost:5001/minewise-ai-4a4da/us-central1/api
    // Production: https://api-tkaqtnga6a-uc.a.run.app
  },
});


