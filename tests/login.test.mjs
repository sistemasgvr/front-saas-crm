import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import ts from "typescript";

function load(relative, dependencies = {}) {
  const exports = {};
  vm.runInNewContext(ts.transpileModule(
    fs.readFileSync(new URL(relative, import.meta.url), "utf8"),
    { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } },
  ).outputText, {
    exports, Error,
    require: (name) => {
      assert.ok(name in dependencies, `Import inesperado: ${name}`);
      return dependencies[name];
    },
  });
  return exports;
}

const results = load("../src/lib/action-result.ts", {
  "./error-message": load("../src/lib/error-message.ts"),
});
class ApiError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}

function fixture({ status = 200, failure, admin = false, changePassword = false } = {}) {
  const calls = [];
  const cookies = [];
  const { loginAction } = load("../src/modules/auth/actions.ts", {
    "@/src/lib/action-result": results,
    "@/src/lib/api": {
      ApiError,
      publicFetch: async (url, options) => {
        calls.push({ url, options });
        if (failure) throw failure;
        return new Response(JSON.stringify(status === 200 ? {
          accessToken: "access-test", refreshToken: "refresh-test",
          usuario: { esAdminPlataforma: admin, debeCambiarPassword: changePassword },
        } : { message: "Internal Server Error" }), { status });
      },
    },
    "@/src/lib/session": {
      setSessionCookies: async (...args) => cookies.push(args),
    },
  });
  const submit = (email = " usuario@example.test ", password = "clave-de-prueba") => {
    const form = new FormData();
    form.set("email", email);
    form.set("password", password);
    return loginAction(form);
  };
  return { submit, calls, cookies };
}

test("401 llega al cliente como credenciales incorrectas sin excepción de servidor ni cookies", async () => {
  const f = fixture({ status: 401 });
  // El resultado cruza el límite servidor/cliente como datos JSON en producción.
  const result = JSON.parse(JSON.stringify(await f.submit()));
  assert.equal(result.ok, false);
  assert.match(result.error, /Correo o contraseña incorrectos/);
  assert.throws(() => results.unwrapAction(result), /Correo o contraseña incorrectos/);
  assert.equal(f.cookies.length, 0);
});

for (const [status, message] of [[400, /formato del correo/], [429, /Demasiados intentos/], [500, /problema del servidor/], [503, /problema del servidor/]]) {
  test(`HTTP ${status} conserva un mensaje diferente al de credenciales`, async () => {
    const f = fixture({ status });
    const result = await f.submit();
    assert.equal(result.ok, false);
    assert.match(result.error, message);
    assert.doesNotMatch(result.error, /contraseña incorrectos/);
    assert.equal(f.cookies.length, 0);
  });
}

for (const [status, message] of [[0, "No se pudo conectar con el servidor."], [408, "El servidor no respondió a tiempo."]]) {
  test(`fallo de red ${status} llega al cliente con su mensaje`, async () => {
    const f = fixture({ failure: new ApiError(status, message) });
    assert.equal((await f.submit()).error, message);
    assert.equal(f.cookies.length, 0);
  });
}

test("datos incompletos no llaman al backend", async () => {
  const f = fixture();
  assert.equal((await f.submit(" ")).ok, false);
  assert.equal((await f.submit("usuario@example.test", "")).ok, false);
  assert.equal(f.calls.length, 0);
});

test("errores inesperados no exponen detalles del servidor", async () => {
  const f = fixture({ failure: new Error("detalle interno privado") });
  assert.match((await f.submit()).error, /problema del servidor/);
});

for (const [options, destination] of [[{}, "/dashboard"], [{ admin: true }, "/admin/organizations"], [{ changePassword: true, admin: true }, "/cambiar-password"]]) {
  test(`login correcto guarda sesión y redirige a ${destination}`, async () => {
    const f = fixture(options);
    assert.equal(results.unwrapAction(await f.submit()).redirectTo, destination);
    assert.equal(f.cookies.length, 1);
    assert.equal(f.calls[0].url, "/auth/login");
    assert.equal(JSON.parse(f.calls[0].options.body).email, "usuario@example.test");
  });
}
