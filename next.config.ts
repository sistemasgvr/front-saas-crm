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
};

export default nextConfig;
