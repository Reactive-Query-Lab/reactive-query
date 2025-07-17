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
      entry: path.resolve(__dirname, "src/index.ts"),
      name: "ReactiveModels",
      fileName: (format) =>
        `reactive-models.${format === "es" ? "esm" : format}.js`,
      formats: ["es", "cjs"],
    },
    rollupOptions: {
      external: ["rxjs"],
      output: {
        globals: {
          rxjs: "rxjs",
        },
        exports: "named",
      },
    },
    sourcemap: true,
    minify: false,
    target: "es2020",
  },
} as VitestConfigExport);
