import { defineConfig } from "vite";

export default defineConfig({
  build: {
    lib: {
      entry: "src/index.ts",
      formats: ["es"],
      fileName: "saucepan",
    },
    outDir: "dist/server",
    emptyOutDir: true,
  },
});
