import { defineConfig } from "vite";
import path from "path";
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
            fileName: function (format) {
                return "reactive-models.".concat(format === "es" ? "esm" : format, ".js");
            },
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
});
