import react from '@vitejs/plugin-react';
import path from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { '@': path.resolve(import.meta.dirname, 'src') } },
  test: {
    environment: 'jsdom',
    globals: true,
    // Starting many jsdom workers at once can time out on a busy machine; a few are enough.
    maxWorkers: 3,
    setupFiles: ['./vitest.setup.ts'],
  },
});
