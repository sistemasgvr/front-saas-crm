import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const root = fileURLToPath(new URL("../", import.meta.url));
class ApiError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}

function fixture({ failure = new ApiError(400, "La contraseña actual no es correcta") } = {}) {
  const cache = new Map();
  const calls = [];
  const redirects = [];
  const toasts = [];
  const navigation = {
    redirect: (url) => {
      const error = new Error("NEXT_REDIRECT");
      error.digest = `NEXT_REDIRECT;replace;${url};307;`;
      redirects.push(error);
      throw error;
    },
    unstable_rethrow: (error) => { if (redirects.includes(error)) throw error; },
  };
  const apiFetch = async (...args) => {
    calls.push(args);
    if (failure) throw failure;
    return { url: "https://meta.example.test/oauth", id: "test-id" };
  };
  function load(file) {
    const absolute = path.resolve(root, file);
    if (cache.has(absolute)) return cache.get(absolute);
    const exports = {};
    cache.set(absolute, exports);
    vm.runInNewContext(ts.transpileModule(fs.readFileSync(absolute, "utf8"), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    }).outputText, {
      exports, Error, FormData, URLSearchParams, Set, encodeURIComponent,
      require: (name) => {
        if (name === "next/navigation") return navigation;
        if (name === "sonner") return { toast: { error: (text) => toasts.push(text) } };
        if (name.endsWith("/api")) return { apiFetch, ApiError };
        if (name.endsWith("/api-collection")) return { apiFetchCollection: apiFetch };
        const resolved = name.startsWith("@/") ? name.slice(2) : path.relative(root, path.resolve(path.dirname(absolute), name));
        return load(`${resolved}.ts`);
      },
    });
    return exports;
  }
  return { load, calls, toasts };
}

function passwordForm(actual = "temporal-de-prueba", nueva = "nueva-de-prueba") {
  const form = new FormData();
  form.set("passwordActual", actual);
  form.set("passwordNueva", nueva);
  return form;
}

test("contraseña actual equivocada cruza servidor/cliente como mensaje de negocio", async () => {
  const f = fixture();
  const { changePasswordAction } = f.load("src/modules/profile/actions.ts");
  const result = JSON.parse(JSON.stringify(await changePasswordAction(passwordForm())));
  assert.equal(result.ok, false);
  assert.equal(result.error, "La contraseña actual no es correcta");
  const { unwrapAction } = f.load("src/lib/action-result.ts");
  assert.throws(() => unwrapAction(result), /contraseña actual no es correcta/);
});

test("contraseña repetida, corta o ausente no ejecuta el cambio en el backend", async () => {
  const f = fixture({ failure: null });
  const { changePasswordAction } = f.load("src/modules/profile/actions.ts");
  assert.match((await changePasswordAction(passwordForm("misma-clave", "misma-clave"))).error, /debe ser diferente/);
  assert.match((await changePasswordAction(passwordForm("temporal", "corta"))).error, /8 caracteres/);
  assert.match((await changePasswordAction(passwordForm("", "clave-nueva"))).error, /contraseña actual/);
  assert.equal(f.calls.length, 0);
});

test("cambio correcto continúa solo después de la confirmación del backend", async () => {
  const f = fixture({ failure: null });
  const { unwrapServerAction } = f.load("src/lib/action-result.ts");
  const change = unwrapServerAction(f.load("src/modules/profile/actions.ts").changePasswordAction);
  assert.equal(await change(passwordForm()), undefined);
  assert.equal(f.calls[0][0], "/me/password");
});

const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
  e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)]);
const actionFiles = walk(path.join(root, "src/modules")).filter((f) =>
  f.endsWith("actions.ts") && fs.readFileSync(f, "utf8").includes('from "@/src/lib/server-action"'));

test("las acciones con validaciones que lanzan errores deben proteger el límite RSC", () => {
  for (const file of walk(path.join(root, "src/modules")).filter((f) => f.endsWith("actions.ts"))) {
    const source = fs.readFileSync(file, "utf8");
    if (source.includes("throw new Error")) {
      assert.ok(source.includes("return runAction("), `${path.relative(root, file)} necesita devolver sus errores como datos`);
    }
  }
});

for (const file of actionFiles) {
  const ast = ts.createSourceFile(file, fs.readFileSync(file, "utf8"), ts.ScriptTarget.Latest, true);
  const functions = ast.statements.filter((n) => ts.isFunctionDeclaration(n) && n.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword));
  for (const fn of functions) {
    test(`${path.relative(root, file)}: ${fn.name.text} devuelve errores serializables`, async () => {
      const f = fixture({ failure: new ApiError(409, "La operación no está permitida") });
      const args = fn.parameters.map((p) => {
        const type = p.type?.getText(ast) ?? "";
        if (type === "FormData") return passwordForm();
        if (type === "boolean") return true;
        if (type.endsWith("[]")) return ["test"];
        if (p.type?.kind === ts.SyntaxKind.StringKeyword || type === "string | null" || type === "0 | 1") return "test";
        return {};
      });
      const result = await f.load(path.relative(root, file))[fn.name.text](...args);
      const serialized = JSON.parse(JSON.stringify(result));
      assert.equal(serialized.ok, false);
      assert.equal(serialized.error, "La operación no está permitida");
      assert.equal(f.calls.length, 1);
      assert.doesNotMatch(serialized.error, /minified react|NEXT_REDIRECT|digest/i);
    });
  }
}

test("el reenvío individual propaga el fallo de la acción de lote", async () => {
  const f = fixture();
  const result = await f.load("src/modules/chats/actions.ts").reenviarMensajeAction("chat", "mensaje", "destino");
  assert.equal(result.ok, false);
});

test("los errores técnicos tienen un texto seguro en pantallas y toasts", () => {
  const { errorMessage } = fixture().load("src/lib/error-message.ts");
  for (const text of ["Minified React error #441; visit https://react.dev/errors/441", "An error occurred in the Server Components render", "Internal Server Error", "digest: xyz"]) {
    assert.equal(errorMessage(new Error(text), "Intenta de nuevo"), "Intenta de nuevo");
  }
});

test("la protección conserva las redirecciones de OAuth", async () => {
  const f = fixture({ failure: null });
  const actions = f.load("src/modules/settings/meta/actions.ts");
  for (const action of [actions.connectMetaAction, actions.requestMetaPermissionsAction, () => actions.grantMetaFeatureAction("leads")]) {
    await assert.rejects(action, /NEXT_REDIRECT/);
  }
});

test("los formularios de OAuth presentan el error sin lanzar otra excepción", async () => {
  const f = fixture();
  const { withFormFeedback } = f.load("src/lib/form-action.ts");
  await withFormFeedback(async () => { throw new Error("No se pudo conectar con Meta"); })();
  assert.deepEqual(f.toasts, ["No se pudo conectar con Meta"]);
});
