import type { NextConfig } from "next";
import path from "path";

/** Raíz real del app (evita detección incorrecta por lockfiles anidados en Hostinger). */
const projectRoot = path.resolve(__dirname);

const nextConfig: NextConfig = {
  // Imagen Docker más liviana (EasyPanel / contenedores).
  output: "standalone",
  outputFileTracingRoot: projectRoot,
  turbopack: {
    root: projectRoot,
  },
};

export default nextConfig;
