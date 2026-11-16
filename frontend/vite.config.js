import { fileURLToPath } from 'node:url';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

const frontendDirectory = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig(({ command, mode }) => {
  const environment = loadEnv(mode, frontendDirectory, 'VITE_');
  if (command === 'build' && !environment.VITE_API_URL) {
    throw new Error('Set VITE_API_URL to the deployed API URL before building for production.');
  }

  return {
    plugins: [react()],
  };
});
