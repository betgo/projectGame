import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: {
    alias: {
      "@editor": path.resolve("editor/src"),
      "@runtime": path.resolve("runtime"),
      "@game": path.resolve("game"),
      "@ai": path.resolve("ai")
    }
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"]
  }
});
