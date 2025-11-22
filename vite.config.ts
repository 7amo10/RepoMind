import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), "");

  // Use the VITE_GEMINI_API_KEY from .env.
  const apiKey = env.VITE_GEMINI_API_KEY || env.API_KEY;

  return {
    plugins: [react()],
    server: {
      port: 3000,
    },
    define: {
      // This safely exposes the API key to the client-side code as process.env.API_KEY
      "process.env.API_KEY": JSON.stringify(apiKey),
    },
  };
});

