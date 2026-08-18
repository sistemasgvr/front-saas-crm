"use strict";

const { spawnSync } = require("child_process");
const path = require("path");

const nextBin = require.resolve("next/dist/bin/next");
const result = spawnSync(
  process.execPath,
  ["--require", path.join(__dirname, "next-safe-trace.cjs"), nextBin, "build", ...process.argv.slice(2)],
  {
    stdio: "inherit",
    env: {
      ...process.env,
      NEXT_TELEMETRY_DISABLED: process.env.NEXT_TELEMETRY_DISABLED || "1",
    },
  },
);

process.exit(result.status ?? 1);
