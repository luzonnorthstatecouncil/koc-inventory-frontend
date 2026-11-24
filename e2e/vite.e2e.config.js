// Wraps the frontend's Vite config for e2e runs: same app on :5174, with /api proxied to the
// test backend on :5055. Copy to node_modules/.cache/vite.e2e.config.mjs (so it resolves the
// frontend's plugins) and run Vite from the frontend folder.
import { defineConfig, mergeConfig } from "vite";
import base from "../../vite.config.js";

export default mergeConfig(
   base,
   defineConfig({
      root: process.cwd(),
      server: {
         port: 5174,
         strictPort: true,
         proxy: { "/api": "http://localhost:5055" },
         // Playwright writes traces under e2e/results during the run; watching them reloads the page mid-test
         watch: { ignored: ["**/e2e/**"] },
      },
   }),
);
