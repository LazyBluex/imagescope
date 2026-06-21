import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";

export default defineConfig({
  root: "src/webview",
  plugins: [svelte()],
  build: {
    outDir: "../../dist/webview",
    emptyOutDir: true,
    cssCodeSplit: false,
    lib: {
      entry: "main.ts",
      formats: ["es"],
      fileName: "main",
    },
    rollupOptions: {
      output: {
        codeSplitting: false,
      },
    },
    sourcemap: false,
  },
});
