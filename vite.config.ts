import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, '.', '');
  
  return {
    plugins: [react()],
    define: {
      // Prevents "process is not defined" error in browser and injects the API key
      'process.env.API_KEY': JSON.stringify(env.API_KEY),
      'process.env': {}
    }
  };
});