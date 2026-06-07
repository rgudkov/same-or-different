/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// `base` must match the GitHub Pages subpath so assets resolve correctly:
// the site is served from https://<user>.github.io/mini-games/.
export default defineConfig({
  base: "/mini-games/",
  plugins: [react()],
  test: {
    // Component tests render into a DOM; pure logic/reducer tests run here too.
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
  },
});
