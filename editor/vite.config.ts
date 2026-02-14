import path from "node:path";

import { defineConfig } from "vite";

export default defineConfig({
  root: path.resolve("editor"),
  resolve: {
    alias: {
      "@editor": path.resolve("editor/src"),
      "@runtime": path.resolve("runtime"),
      "@game": path.resolve("game"),
      "@ai": path.resolve("ai")
    }
  },
  server: {
    port: 5173
  }
});
