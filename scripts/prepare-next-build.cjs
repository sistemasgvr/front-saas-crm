"use strict";

const fs = require("fs");
const path = require("path");

const distDir = path.join(process.cwd(), ".next");

try {
  const stat = fs.statSync(distDir);
  if (stat.isFile()) fs.unlinkSync(distDir);
} catch (err) {
  if (err && err.code !== "ENOENT") {
    console.warn("[prepare-next-build] no se pudo inspeccionar .next:", err.message);
  }
}

for (const name of ["trace", "trace-build"]) {
  try {
    fs.rmSync(path.join(distDir, name), { force: true });
  } catch {
    // Hostinger may already block these files; the build wrapper handles that.
  }
}

fs.mkdirSync(distDir, { recursive: true });
