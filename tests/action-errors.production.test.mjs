import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const root = fileURLToPath(new URL("../", import.meta.url));
const dist = process.env.NEXT_TEST_DIST_DIR;

test("los errores de login y contraseña conservan su mensaje en Next.js de producción", {
  skip: !dist && "Requiere NEXT_TEST_DIST_DIR con una compilación de producción",
  timeout: 60_000,
}, async () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(root, dist, "server/server-reference-manifest.json"), "utf8"));
  const actionId = (name) => {
    const found = Object.entries(manifest.node).find(([, value]) => value.exportedName === name);
    assert.ok(found, `Acción ausente: ${name}`);
    return found[0];
  };
  const { encodeReply } = require("next/dist/compiled/react-server-dom-turbopack/client.node");
  let passwordStatus = 400;
  let passwordCalls = 0;
  const api = http.createServer((request, response) => {
    response.setHeader("Content-Type", "application/json");
    if (request.url === "/api/auth/login") {
      response.writeHead(401).end(JSON.stringify({ message: "Credenciales inválidas" }));
    } else if (request.url === "/api/me/password") {
      passwordCalls++;
      response.writeHead(passwordStatus).end(passwordStatus === 204 ? undefined : JSON.stringify({ message: "La contraseña actual no es correcta" }));
    } else if (request.url === "/api/me") {
      response.end(JSON.stringify({ usuario: { id: "test", nombre: "Prueba", email: "test@example.test", debeCambiarPassword: true, esAdminPlataforma: false }, organizacion: null, rol: null, modulos: [] }));
    } else {
      response.writeHead(404).end("{}");
    }
  });
  api.listen(0, "127.0.0.1");
  await once(api, "listening");
  const reserve = http.createServer();
  reserve.listen(0, "127.0.0.1");
  await once(reserve, "listening");
  const port = reserve.address().port;
  await new Promise((resolve) => reserve.close(resolve));
  const origin = `http://127.0.0.1:${port}`;
  const child = spawn(process.execPath, [require.resolve("next/dist/bin/next"), "start", "--hostname", "127.0.0.1", "--port", String(port)], {
    cwd: root,
    windowsHide: true,
    env: { ...process.env, NODE_ENV: "production", NEXT_DIST_DIR: dist, API_URL: `http://127.0.0.1:${api.address().port}/api`, NEXT_TELEMETRY_DISABLED: "1" },
    stdio: ["ignore", "pipe", "pipe"],
  });
  let logs = "";
  child.stdout.on("data", (data) => { logs += data; });
  child.stderr.on("data", (data) => { logs += data; });
  try {
    let ready = false;
    for (let attempt = 0; attempt < 100; attempt++) {
      if (child.exitCode !== null) throw new Error(`Next.js terminó: ${logs}`);
      try { ready = (await fetch(`${origin}/login`, { signal: AbortSignal.timeout(1000) })).ok; } catch { /* Esperar al servidor local. */ }
      if (ready) break;
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    assert.ok(ready, `Next.js no inició: ${logs}`);
    async function invoke(route, name, fields, cookie = "") {
      const form = new FormData();
      for (const [key, value] of Object.entries(fields)) form.set(key, value);
      const response = await fetch(`${origin}${route}`, {
        method: "POST",
        headers: { "Next-Action": actionId(name), Origin: origin, Accept: "text/x-component", Cookie: cookie },
        body: await encodeReply([form]),
      });
      const body = await response.text();
      assert.equal(response.status, 200, body);
      assert.doesNotMatch(body, /^\w+:E\{/m, body);
      const result = body.split("\n").flatMap((line) => {
        try { return [JSON.parse(line.slice(line.indexOf(":") + 1))]; } catch { return []; }
      }).find((value) => value && typeof value.ok === "boolean");
      assert.ok(result, `No llegó el resultado de la acción: ${body}`);
      return result;
    }
    const login = await invoke("/login", "loginAction", { email: "test@example.test", password: "clave-invalida" });
    assert.equal(login.ok, false);
    assert.match(login.error, /Correo o contraseña incorrectos/);
    const repeated = await invoke("/cambiar-password", "changePasswordAction", { passwordActual: "clave-repetida", passwordNueva: "clave-repetida" }, "access_token=test-local");
    assert.equal(repeated.ok, false);
    assert.match(repeated.error, /debe ser diferente/);
    assert.equal(passwordCalls, 0);
    const incorrect = await invoke("/cambiar-password", "changePasswordAction", { passwordActual: "clave-incorrecta", passwordNueva: "clave-nueva" }, "access_token=test-local");
    assert.equal(incorrect.error, "La contraseña actual no es correcta");
    passwordStatus = 204;
    const correct = await invoke("/cambiar-password", "changePasswordAction", { passwordActual: "clave-temporal", passwordNueva: "clave-nueva" }, "access_token=test-local");
    assert.equal(correct.ok, true);
    assert.equal(passwordCalls, 2);
  } finally {
    if (child.exitCode === null) {
      const stopped = once(child, "exit");
      child.kill();
      await stopped;
    }
    api.closeAllConnections();
    await new Promise((resolve) => api.close(resolve));
  }
});
