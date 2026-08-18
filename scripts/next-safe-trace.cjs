"use strict";

const fs = require("fs");
const os = require("os");
const path = require("path");

function isNextTraceFile(file) {
  if (typeof file !== "string") return false;
  const normalized = file.replace(/\\/g, "/");
  const base = path.basename(normalized);
  return (
    (base === "trace" || base === "trace-build" || base.startsWith("trace.")) &&
    normalized.includes("/.next/")
  );
}

function safeTracePath(file) {
  return path.join(os.tmpdir(), `next-${path.basename(file)}-${process.pid}`);
}

function remap(file) {
  return isNextTraceFile(file) ? safeTracePath(file) : file;
}

const originalCreateWriteStream = fs.createWriteStream.bind(fs);
fs.createWriteStream = function createWriteStream(file, options) {
  const target = remap(file);
  const stream = originalCreateWriteStream(target, options);
  if (target !== file) stream.on("error", () => {});
  return stream;
};

const originalOpen = fs.open;
fs.open = function open(file, ...rest) {
  return originalOpen.call(this, remap(file), ...rest);
};

const originalOpenSync = fs.openSync;
fs.openSync = function openSync(file, ...rest) {
  return originalOpenSync.call(this, remap(file), ...rest);
};

const originalPromisesOpen = fs.promises.open.bind(fs.promises);
fs.promises.open = function open(file, ...rest) {
  return originalPromisesOpen(remap(file), ...rest);
};
