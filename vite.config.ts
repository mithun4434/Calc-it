import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Load variables from .env files in the current working directory
  const env = loadEnv(mode, process.cwd(), '');
  
  // Capture the API key. 
  // Priority: VITE_API_KEY (Vite standard) > API_KEY (Generic) > process.env (System)
  const apiKey = env.VITE_API_KEY || env.API_KEY || process.env.API_KEY;

  if (!apiKey) {
      console.warn("⚠️  WARNING: API_KEY is missing in the build environment. The app may not function correctly.");
  }

  return {
    plugins: [react()],
    define: {
      // Injects the key into the code as a global constant
      '__API_KEY__': JSON.stringify(apiKey),
      // Legacy fallback
      'process.env.API_KEY': JSON.stringify(apiKey),
    }
  };
});