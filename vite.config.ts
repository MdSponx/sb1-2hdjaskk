import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: ['@vidstack/react', 'lit']
  },
  resolve: {
    dedupe: ['@vidstack/react', 'lit']
  }
});