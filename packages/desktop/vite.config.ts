import { defineConfig } from "vite";
import solidPlugin from "vite-plugin-solid";

// https://tauri.app/v1/guides/getting-started/setup/vite
export default defineConfig({
  plugins: [solidPlugin()],

  // Vite options tailored for Tauri development
  clearScreen: false,
  server: {
    port: 1420,
    strictPort: true,
    watch: {
      // 3. tell vite to ignore watching `src-tauri`
      ignored: ["**/src-tauri/**"],
    },
  },
});
