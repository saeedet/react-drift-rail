import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
export default defineConfig({
  root: fileURLToPath(new URL('.', import.meta.url)),
  plugins: [react()],
  resolve: {
    alias: [
      {
        find: 'react-drift-rail/styles.css',
        replacement: fileURLToPath(new URL('../../src/styles.css', import.meta.url)),
      },
      {
        find: 'react-drift-rail',
        replacement: fileURLToPath(new URL('../../src/index.ts', import.meta.url)),
      },
    ],
  },
});
