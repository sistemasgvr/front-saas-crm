import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { createRequire } from "node:module";
import ts from "typescript";
import { fileURLToPath } from "node:url";

const testRoot = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

function load(file) {
  const source = fs.readFileSync(path.join(testRoot, "..", file), "utf8");
  const result = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  });
  const sandboxModule = { exports: {} };
  vm.runInNewContext(result.outputText, { module: sandboxModule, exports: sandboxModule.exports, require });
  return sandboxModule.exports;
}

const { cn } = load("src/lib/cn.ts");
const clases = (value) => value.split(/\s+/).filter(Boolean);

test("el className de quien usa el componente reemplaza padding y alto del base (filtros compactos)", () => {
  const base = "h-11 w-full px-4 py-2.5 pr-11 text-sm text-gray-400";
  const compacto = "!h-9 px-3 py-1.5 pr-9 text-theme-sm";
  const r = clases(cn(base, compacto));
  assert.ok(r.includes("py-1.5") && !r.includes("py-2.5"), r.join(" "));
  assert.ok(r.includes("px-3") && !r.includes("px-4"), r.join(" "));
  assert.ok(r.includes("pr-9") && !r.includes("pr-11"), r.join(" "));
  assert.ok(r.includes("!h-9"), r.join(" "));
});

test("los tamaños del tema (text-theme-*, text-title-*) son tamaños de letra, no colores", () => {
  const r = clases(cn("text-sm text-gray-400", "text-theme-sm"));
  assert.ok(r.includes("text-gray-400"), "no debe borrar el color");
  assert.ok(r.includes("text-theme-sm") && !r.includes("text-sm"), r.join(" "));
  const t = clases(cn("text-gray-800 text-theme-xs", "text-title-sm"));
  assert.deepEqual(t, ["text-gray-800", "text-title-sm"]);
});

test("las sombras del tema se reemplazan entre sí", () => {
  assert.equal(cn("shadow-theme-xs", "shadow-none"), "shadow-none");
});
