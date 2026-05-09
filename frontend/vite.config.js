import { defineConfig } from "vite";
import { dirname, resolve } from "node:path";
import { readFileSync } from "node:fs";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// plugin to replace __VITE_DATA__ with sample data
function sampleDataInjectionPlugin() {
  return {
    name: "data-injection",
    apply: "serve",
    configureServer(server) {
      const data = readFileSync(resolve(import.meta.dirname, "sample_data.json"), "utf-8");

      server.middlewares.use((req, res, next) => {
        const originalEnd = res.end.bind(res);
        res.end = (chunk, ...args) => {
          if (typeof chunk === "string") {
            chunk = chunk
              .replace("__VITE_DATA__", data) // inject sample data
              .replace("window.__DEMO__ = false;", "window.__DEMO__ = true;"); // enable demo mode
          }
          return originalEnd(chunk, ...args);
        };
        next();
      });
    },
  };
}

export default defineConfig({
  server: {
    proxy: {
      "/api": "http://localhost:8001",
    },
  },
  build: {
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, "_template.html"),
        index: resolve(import.meta.dirname, "index.html"),
      },
    },
  },
  plugins: [react(), tailwindcss(), sampleDataInjectionPlugin()],
});
