import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";

// ES modules have no __dirname
const projectDir = path.dirname(fileURLToPath(import.meta.url));

// Long-lived vendor chunks: these change rarely, so browsers keep them cached across deploys
// and only re-download the (small) app chunks. Page-specific libraries (charts, spreadsheets,
// PDF) are not listed: they load with the pages that use them.
const VENDOR_CHUNKS = {
   "vendor-react": ["react", "react-dom", "react-router", "react-router-dom", "scheduler"],
   "vendor-state": ["@reduxjs/toolkit", "react-redux", "redux", "immer", "reselect"],
   "vendor-ui": ["@radix-ui", "lucide-react", "sonner", "class-variance-authority", "tailwind-merge", "clsx"],
   "vendor-forms": ["react-hook-form", "@hookform/resolvers", "zod"],
   "vendor-dates": ["date-fns", "react-day-picker"],
};

const vendorChunkFor = (id) => {
   if (!id.includes("node_modules")) return undefined;
   for (const [chunk, packages] of Object.entries(VENDOR_CHUNKS)) {
      if (packages.some((pkg) => id.includes(`/node_modules/${pkg}/`) || id.includes(`\\node_modules\\${pkg}\\`))) {
         return chunk;
      }
   }
   return undefined;
};

// https://vite.dev/config/
export default defineConfig({
   plugins: [react(), tailwindcss()],
   resolve: {
      alias: {
         "@": path.resolve(projectDir, "./src"),
      },
   },
   build: {
      rollupOptions: {
         output: {
            manualChunks: vendorChunkFor,
         },
      },
   },
});
