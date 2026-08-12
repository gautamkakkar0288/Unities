import { defineConfig } from "vitest/config"
import react from "@vitejs/plugin-react"
import tsconfigPaths from "vite-tsconfig-paths"

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    include: ["**/*.{test,spec}.{ts,tsx}"],
    /**
     * Globstars matter here. Setting this key replaces vitest's defaults, and
     * bare "node_modules" matches a path *equal to* that string rather than
     * anything beneath it - which left the include glob free to walk into
     * dependencies and run their test files.
     */
    exclude: ["**/node_modules/**", "**/.next/**", "**/dist/**"],
  },
})
