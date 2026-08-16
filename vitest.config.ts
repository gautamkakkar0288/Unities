import path from "node:path"
import { fileURLToPath } from "node:url"
import { defineConfig } from "vitest/config"
import react from "@vitejs/plugin-react"
import tsconfigPaths from "vite-tsconfig-paths"

const __dirname = fileURLToPath(new URL(".", import.meta.url))

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    environment: "jsdom",
    globals: true,
    // Absolute path so vitest never resolves setup relative to a parent
    // workspace config when Unities is nested inside another repo.
    setupFiles: [path.resolve(__dirname, "vitest.setup.ts")],
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
