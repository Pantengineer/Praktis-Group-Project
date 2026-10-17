import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react()],
    resolve: {
      alias: {
        react: path.resolve(__dirname, './node_modules/react'),
        'react-dom': path.resolve(__dirname, './node_modules/react-dom'),
        'react-is': path.resolve(__dirname, './node_modules/react-is'),
      },
      dedupe: ['react', 'react-dom', 'react-is', 'react-router', 'react-router-dom'],
    },
    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        'react-dom/client',
        'react-router',
        'react-router-dom',
        'react-is',
        'recharts',
        'react-calendar',
        'framer-motion',
        'axios',
      ],
      force: true,
    },
    server: {
      host: true,
      allowedHosts: [
        'praktis-project.site',
        '.praktis-project.site',
        'localhost',
        '127.0.0.1',
      ],
      proxy: {
        '/api': {
          target: env.VITE_API_URL || 'http://localhost:5001',
          changeOrigin: true,
          secure: false,
        },
      },
    },
  };
});