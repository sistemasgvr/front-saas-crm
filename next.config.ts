import type { NextConfig } from "next";
import path from "path";

/** Raíz real del app (evita detección incorrecta por lockfiles anidados en Hostinger). */
const projectRoot = path.resolve(__dirname);

const nextConfig: NextConfig = {
  outputFileTracingRoot: projectRoot,
  turbopack: {
    root: projectRoot,
  },
};

export default nextConfig;
