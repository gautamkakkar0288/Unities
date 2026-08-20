import type { NextConfig } from "next"
import path from "node:path"

const nextConfig: NextConfig = {
  turbopack: {
    // Explicitly set the root to this project directory.
    // Without this, Next.js detects the parent repo's package-lock.json and
    // incorrectly infers its directory as the workspace root, producing a
    // spurious warning on every dev/build invocation.
    root: path.resolve(__dirname),
  },
}

export default nextConfig
