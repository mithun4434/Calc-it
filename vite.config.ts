import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Load variables from .env files
  // The third argument '' means load all variables, not just those starting with VITE_
  const env = loadEnv(mode, '.', '');
  
  // Capture the API key from:
  // 1. System Environment (e.g. Vercel/Netlify/Docker console)
  // 2. .env files
  // 3. Fallback to undefined if missing
  const apiKey = process.env.API_KEY || env.API_KEY || env.VITE_API_KEY;

  return {
    plugins: [react()],
    define: {
      // Injects the key into the code. 
      // JSON.stringify is crucial to ensure it appears as a string literal in the browser.
      'process.env.API_KEY': JSON.stringify(apiKey),
      
      // Polyfill process.env to prevent crashes if other libraries access it
      'process.env': {}
    }
  };
});
