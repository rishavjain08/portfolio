import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  /**
   * The app is served under /portfolio/ behind a reverse proxy, so every URL it
   * emits has to carry that prefix. This rewrites the asset URLs in the built
   * index.html and is exposed at runtime as import.meta.env.BASE_URL, which is
   * what config/stage.ts builds the model URL from.
   *
   * The dev server honours it too: `npm run dev` now serves the app at
   * /portfolio/ rather than at /. That is deliberate. Development exercising a
   * different base from production is exactly how base-prefix bugs reach a
   * deploy unnoticed.
   */
  base: "/portfolio/",

  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      output: {
        /**
         * Keep the 3D stack out of the initial chunk. Scene.tsx is lazy-loaded,
         * so first paint ships only React + Motion; three, R3F, drei and the
         * postprocessing pass arrive on demand.
         */
        manualChunks(id: string) {
          if (id.includes("node_modules")) {
            if (/three|@react-three/.test(id)) return "three";
            if (id.includes("gsap")) return "gsap";
          }
          return undefined;
        },
      },
    },
  },
});
