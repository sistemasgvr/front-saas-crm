import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import ts from "typescript";
import { fileURLToPath } from "node:url";

const routeFile = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "../app/api/organizations/logo/route.ts",
);
function fixture({ token = "token-prueba", fail } = {}) {
  const calls = [];
  class ApiError extends Error {
    constructor(status, message) {
      super(message);
      this.status = status;
    }
  }
  const exports = {};
  vm.runInNewContext(
    ts.transpileModule(fs.readFileSync(routeFile, "utf8"), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
      },
    }).outputText,
    {
      exports,
      Request,
      Response,
      File,
      FormData,
      URL,
      AbortSignal,
      Uint8Array,
      fetch: async (url, options) => {
        calls.push({ url, options });
        return new Response(new Uint8Array([1, 2, 3]), {
          headers: { "Content-Type": "image/webp" },
        });
      },
      require: (name) => {
        if (name.endsWith("/session"))
          return { getAccessToken: async () => token };
        if (name.endsWith("/api-url"))
          return { getApiUrl: () => "http://backend.test/api" };
        if (name.endsWith("/api"))
          return {
            ApiError,
            apiFetch: async (url, options) => {
              calls.push({ url, options });
              if (fail) throw new ApiError(fail.status, fail.message);
              return {
                id: "empresa-activa",
                logoUrl: "/api/organizations/logo?v=nueva.webp",
              };
            },
          };
        throw Error(`Import inesperado: ${name}`);
      },
    },
  );
  return { route: exports, calls };
}
const request = (method, body, headers = { origin: "http://crm.test" }) =>
  new Request("http://crm.test/api/organizations/logo", {
    method,
    headers,
    ...(body ? { body } : {}),
  });

test("la subida solo reenvía el archivo y no acepta empresa ni claves del navegador", async () => {
  const { route, calls } = fixture();
  const form = new FormData();
  form.set(
    "archivo",
    new File([new Uint8Array([1, 2, 3])], "logo.png", { type: "image/png" }),
  );
  form.set("organizacionId", "otra-empresa");
  form.set("key", "../otro/logo.png");
  assert.equal((await route.POST(request("POST", form))).status, 200);
  assert.equal(calls[0].url, "/organizations/current/logo");
  assert.deepEqual([...calls[0].options.body.keys()], ["archivo"]);
});
test("el proxy rechaza otros orígenes y sesiones ausentes antes de reenviar", async () => {
  const f = fixture();
  assert.equal(
    (
      await f.route.POST(
        request("POST", undefined, { origin: "https://otro.test" }),
      )
    ).status,
    403,
  );
  assert.equal(
    (await f.route.DELETE(request("DELETE", undefined, {}))).status,
    403,
  );
  assert.equal(f.calls.length, 0);
  const anonymous = fixture({ token: null });
  assert.equal((await anonymous.route.POST(request("POST"))).status, 401);
  assert.equal((await anonymous.route.GET(request("GET"))).status, 401);
  assert.equal(anonymous.calls.length, 0);
});
test("un cuerpo demasiado grande o multipart inválido no llega al backend", async () => {
  const f = fixture();
  assert.equal(
    (
      await f.route.POST(
        request("POST", new Uint8Array(2 * 1024 * 1024 + 65537)),
      )
    ).status,
    413,
  );
  assert.equal(
    (await f.route.POST(request("POST", "no-multipart"))).status,
    400,
  );
  assert.equal(f.calls.length, 0);
});
test("la imagen se descarga con sesión, sin caché compartida ni URL pública de MinIO", async () => {
  const f = fixture();
  const response = await f.route.GET(
    new Request("http://crm.test/api/organizations/logo?v=version.webp"),
  );
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("cache-control"), "private, no-store");
  assert.equal(response.headers.get("vary"), "Cookie");
  assert.equal(response.headers.get("content-type"), "image/webp");
  assert.equal(
    f.calls[0].url,
    "http://backend.test/api/organizations/current/logo?v=version.webp",
  );
  assert.equal(f.calls[0].options.headers.Authorization, "Bearer token-prueba");
});
test("quitar conserva la autorización del backend y entrega su error en español", async () => {
  const f = fixture({
    fail: { status: 403, message: "Tu rol no permite esta acción" },
  });
  const response = await f.route.DELETE(request("DELETE"));
  assert.equal(response.status, 403);
  assert.equal(
    (await response.json()).message,
    "Tu rol no permite esta acción",
  );
});

test("acepta el origen HTTPS detrás del proxy y sigue rechazando hosts distintos", async () => {
  const f = fixture();
  const headers = {
    host: "crm.test",
    origin: "https://crm.test",
    "x-forwarded-proto": "https",
  };
  const response = await f.route.DELETE(
    new Request("http://internal:3000/api/organizations/logo", {
      method: "DELETE",
      headers,
    }),
  );
  assert.equal(response.status, 200);
  const rejected = await f.route.DELETE(
    new Request("http://internal:3000/api/organizations/logo", {
      method: "DELETE",
      headers: { ...headers, origin: "https://otra.test" },
    }),
  );
  assert.equal(rejected.status, 403);
  assert.equal(f.calls.length, 1);
});
