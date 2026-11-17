import assert from "node:assert/strict";
import fs from "node:fs";
import { test } from "node:test";
import vm from "node:vm";
import ts from "typescript";

const { outputText } = ts.transpileModule(
  fs.readFileSync(new URL("../src/modules/chats/enviar-adjunto.ts", import.meta.url), "utf8"),
  { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } },
);

function cargarCliente(fetch) {
  const exports = {};
  vm.runInNewContext(outputText, { exports, fetch, File });
  return exports.enviarAdjunto;
}

function adjunto(bytes) {
  const form = new FormData();
  form.set("archivo", new File([new Uint8Array(bytes)], "recorrido.mp4", { type: "video/mp4" }));
  form.set("caption", "Video de recorrido");
  form.set("respondeAMensajeId", "mensaje-citado");
  return form;
}

test("el MP4 de 6,1 MB va directo al almacenamiento y Vercel solo recibe metadatos", async () => {
  const llamadas = [];
  const enviar = cargarCliente(async (url, init) => {
    llamadas.push([url, init]);
    if (url.endsWith("fase=preparar")) {
      return Response.json({ url: "https://storage.test/privado", cargaId: "carga" });
    }
    return new Response(null, { status: 204 });
  });
  const bytes = Math.ceil(6.1 * 1024 ** 2);
  await enviar("chat", adjunto(bytes));
  assert.equal(llamadas.length, 3);
  assert.ok(llamadas[0][0].endsWith("fase=preparar"));
  assert.deepEqual(JSON.parse(llamadas[0][1].body), { mimeType: "video/mp4", tamanoBytes: bytes });
  assert.equal(llamadas[1][0], "https://storage.test/privado");
  assert.equal(llamadas[1][1].method, "PUT");
  assert.equal(llamadas[1][1].credentials, "omit");
  assert.equal(llamadas[1][1].body.size, bytes);
  assert.ok(llamadas[2][0].endsWith("fase=confirmar"));
  assert.deepEqual(JSON.parse(llamadas[2][1].body), {
    mimeType: "video/mp4",
    tamanoBytes: bytes,
    cargaId: "carga",
    nombreArchivo: "recorrido.mp4",
    caption: "Video de recorrido",
    respondeAMensajeId: "mensaje-citado",
  });
});

test("un multipart pequeño conserva la ruta de envío y traduce un 413 sin JSON", async () => {
  const enviar = cargarCliente(async (url, init) => {
    assert.equal(url, "/api/whatsapp/chats/chat/media");
    assert.ok(init.body instanceof FormData);
    return new Response("FUNCTION_PAYLOAD_TOO_LARGE", { status: 413 });
  });
  await assert.rejects(enviar("chat", adjunto(1024)), /supera el tamaño permitido/);
});

test("si falla el PUT al almacenamiento no se confirma el envío", async () => {
  const llamadas = [];
  const enviar = cargarCliente(async (url) => {
    llamadas.push(url);
    if (url.endsWith("fase=preparar")) {
      return Response.json({ url: "https://storage.test/privado", cargaId: "carga" });
    }
    return new Response(null, { status: 503 });
  });
  await assert.rejects(enviar("chat", adjunto(5 * 1024 ** 2)), /No se pudo cargar el archivo/);
  assert.equal(llamadas.length, 2);
});
