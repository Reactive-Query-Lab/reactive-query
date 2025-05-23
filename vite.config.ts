import { defineConfig, InlineConfig, UserConfig } from "vite";
import path from "path";

interface VitestConfigExport extends UserConfig {
  test: InlineConfig;
}

export default defineConfig({
  test: {
    globals: true,
    setupFiles: "src/test/setup.ts",
    root: "./",
    coverage: {
      provider: "v8",
      reporter: ["lcov", "clover"],
      reportsDirectory: "coverage",
    },
  },
  plugins: [],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    lib: {
      entry: "./src/index.ts",
      name: "reactive-models",
    },
  },
} as VitestConfigExport);
