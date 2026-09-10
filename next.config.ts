import type { NextConfig } from "next";
import path from "path";

/** Raíz real del app (evita detección incorrecta por lockfiles anidados en Hostinger). */
const projectRoot = path.resolve(__dirname);

/** Solo Docker/EasyPanel. En Vercel `output: "standalone"` rompe onBuildComplete
 * (ENOENT next-server.js.nft.json). */
const esBuildDocker = process.env.DOCKER_BUILD === "1";

const nextConfig: NextConfig = {
  ...(esBuildDocker ? { output: "standalone" as const } : {}),
  outputFileTracingRoot: projectRoot,
  turbopack: {
    root: projectRoot,
  },
  async headers() {
    const noCache = [
      { key: "Cache-Control", value: "public, max-age=0, must-revalidate" },
    ];
    return [
      { source: "/icon.png", headers: noCache },
      { source: "/icon-maskable.png", headers: noCache },
      { source: "/manifest.webmanifest", headers: noCache },
      { source: "/sw.js", headers: noCache },
    ];
  },
};

export default nextConfig;
