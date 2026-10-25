import { defineConfig } from "vite";

export default defineConfig({
  root: "html",
  build: {
    rollupOptions: {
      input: {
        search: "search/page.html",
        chat: "chat/chat.html",
      },
    },
  },
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
    },
  },
});
