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
    proxy: {
      '/api': {
        target: 'http://localhost:5001',
        changeOrigin: true,
        secure: false,
        ws: false,
        timeout: 60000,
        configure: (proxy, _options) => {
          proxy.on('error', (err, req, res) => {
            // Handle proxy errors gracefully during server restarts
            const errorCode = (err as any).code;
            const isConnectionError = 
              errorCode === 'ECONNRESET' || 
              errorCode === 'ECONNREFUSED' || 
              errorCode === 'ETIMEDOUT' ||
              err.message?.includes('ECONNRESET') ||
              err.message?.includes('ECONNREFUSED');
            
            // Only log connection errors at debug level (they're expected during restarts)
            if (isConnectionError && process.env.DEBUG) {
              console.log(`⚠️ Proxy connection error (${errorCode}): Server may be restarting`);
            }
            
            // Try to send error response if possible
            if (res && !res.headersSent) {
              try {
                res.writeHead(503, {
                  'Content-Type': 'application/json',
                });
                res.end(JSON.stringify({
                  error: 'Service temporarily unavailable',
                  message: 'The API server is restarting. Please try again in a moment.',
                  retryable: true,
                }));
              } catch {
                // Ignore errors when sending response
              }
            }
          });
        },
      },
    },
  },
});


