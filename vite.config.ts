import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Load variables from .env files in the current working directory
  const env = loadEnv(mode, process.cwd(), '');
  
  // Capture the API key from all possible sources.
  const apiKey = 
      env.API_KEY || 
      env.VITE_API_KEY || 
      env.GOOGLE_API_KEY || 
      env.GEMINI_API_KEY || 
      process.env.API_KEY || 
      process.env.GOOGLE_API_KEY || 
      process.env.GEMINI_API_KEY;

  if (!apiKey) {
      console.warn("⚠️  WARNING: API_KEY is missing in the build environment.");
  }

  return {
    plugins: [react()],
    define: {
      // Injects the key into the code as a global constant.
      // We default to '' if undefined to prevent "variable is not defined" errors in browser.
      '__API_KEY__': JSON.stringify(apiKey || ''),
      
      // Fallback for libraries expecting process.env
      'process.env.API_KEY': JSON.stringify(apiKey || ''),
      'process.env': {} 
    }
  };
});