import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import ts from "typescript";
import { fileURLToPath } from "node:url";
const testRoot = path.dirname(fileURLToPath(import.meta.url));

function load(file) {
  const source = fs.readFileSync(path.join(testRoot, "..", file), "utf8");
  const result = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  });
  const sandboxModule = { exports: {} };
  vm.runInNewContext(result.outputText, {
    module: sandboxModule,
    exports: sandboxModule.exports,
  });
  return sandboxModule.exports;
}
const catalog = load("src/modules/guides/catalog.ts");
const progress = load("src/modules/guides/progress.ts");
const access = (rol, codes = []) => ({
  rol,
  modulos: codes.map((codigo) => ({ codigo, habilitado: true, grupo: "CRM" })),
});
const all = [
  "LEADS",
  "WHATSAPP",
  "META_LEADS",
  "INMUEBLES",
  "DASHBOARD",
  "AUTOMATIZACIONES",
];

test("el recorrido de un lead espera la selección y continúa en su detalle", () => {
  const guide = catalog.guides.find((g) => g.id === "lead-detalle");
  assert.equal(catalog.guideSelectionState(guide, "/ayuda"), "choose");
  assert.equal(catalog.guideSelectionState(guide, "/leads"), "choose");
  assert.equal(catalog.guideSelectionState(guide, "/leads/tablero"), "choose");
  assert.equal(
    catalog.guideSelectionState(guide, "/leads/registro-elegido"),
    "ready",
  );
  assert.equal(catalog.guideSelectionState(guide, "/agenda"), "leave");
  assert.equal(catalog.guideSelectionState(guide, "/leads-otra-ruta"), "leave");
});

test("los demás detalles conservan el mismo flujo y nombran bien el registro", () => {
  for (const [id, label, detail] of [
    ["chat-atencion", "chat", "/chats/elegido"],
    ["inmueble-detalle", "inmueble", "/inmuebles/elegido"],
    ["meta-paginas-detalle", "página", "/settings/meta/pages/elegida"],
    [
      "meta-cuentas-detalle",
      "cuenta publicitaria",
      "/settings/meta/ad-accounts/elegida",
    ],
  ]) {
    const guide = catalog.guides.find((g) => g.id === id);
    assert.equal(catalog.guideRecordLabel(guide), label);
    assert.equal(catalog.guideSelectionState(guide, guide.path), "choose");
    assert.equal(catalog.guideSelectionState(guide, detail), "ready");
    assert.equal(catalog.guideSelectionState(guide, "/profile"), "leave");
  }
  const edit = catalog.guides.find((g) => g.id === "inmueble-editar");
  assert.equal(
    catalog.guideSelectionState(edit, "/inmuebles/elegido"),
    "choose",
  );
  assert.equal(
    catalog.guideSelectionState(edit, "/inmuebles/elegido/editar"),
    "ready",
  );
});

test("los agentes solo reciben temas permitidos y nunca administración", () => {
  const agent = access("USUARIO", ["LEADS", "WHATSAPP"]);
  const guides = catalog.availableGuides(agent);
  assert(guides.some((g) => g.id === "chat-atencion"));
  assert(guides.some((g) => g.id === "lead-detalle"));
  assert(!guides.some((g) => g.admin || g.module === "INMUEBLES"));
  const welcome = guides.find((g) => g.id === "bienvenida");
  assert(
    !catalog
      .guideSteps(welcome, agent)
      .some((s) => s.admin || s.module === "INMUEBLES"),
  );
});
test("un administrador sin un módulo tampoco ve su recorrido", () => {
  const minimal = catalog.availableGuides(access("ADMINISTRADOR"));
  assert(minimal.some((g) => g.id === "usuarios"));
  assert(!minimal.some((g) => g.module));
  assert.equal(
    catalog.availableGuides(access("PROPIETARIO", all)).length,
    catalog.guides.length,
  );
});
test("detalle, tablero, alta y edición no se confunden entre sí", () => {
  const matches = (pathname) =>
    catalog.guides
      .filter((g) => catalog.guideMatches(g, pathname))
      .map((g) => g.id);
  assert.deepEqual([...matches("/leads/tablero")], ["tablero"]);
  assert.deepEqual([...matches("/leads/ejemplo")], ["lead-detalle"]);
  assert.deepEqual([...matches("/inmuebles/nuevo")], ["inmueble-formulario"]);
  assert.deepEqual(
    [...matches("/inmuebles/ejemplo/editar")],
    ["inmueble-editar"],
  );
  assert.deepEqual(
    [...matches("/chats/ejemplo")],
    ["chat-atencion", "chat-mensajes"],
  );
  assert.equal(matches("/admin/users").length, 0);
});
test("cada recorrido tiene un identificador único, contenido suficiente y una pantalla de entrada existente", () => {
  const ids = catalog.guides.map((g) => g.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const guide of catalog.guides) {
    assert(guide.steps.length >= 5, guide.id);
    assert(
      fs.existsSync(
        path.join(testRoot, "..", "app", "(app)", guide.path, "page.tsx"),
      ),
      guide.path,
    );
    assert(guide.ready, guide.id);
    for (const step of guide.steps) {
      assert(
        step.title && step.description.length > 40,
        `${guide.id}: ${step.title}`,
      );
      assert(!/<script|<iframe|onclick\s*=/i.test(step.description));
    }
  }
});
test("las anclas propias de cada recorrido existen en las pantallas", () => {
  function walk(dir) {
    return fs
      .readdirSync(dir, { withFileTypes: true })
      .flatMap((f) =>
        f.isDirectory()
          ? walk(path.join(dir, f.name))
          : /\.tsx$/.test(f.name)
            ? [path.join(dir, f.name)]
            : [],
      );
  }
  const source = [
    ...walk(path.join(testRoot, "..", "src")),
    ...walk(path.join(testRoot, "..", "app")),
  ]
    .map((f) => fs.readFileSync(f, "utf8"))
    .join("\n");
  for (const guide of catalog.guides) {
    for (const selector of [
      guide.ready,
      ...guide.steps.map((s) => s.target).filter(Boolean),
    ]) {
      for (const [, id] of selector.matchAll(/\[data-tour="([^"]+)"\]/g))
        assert(source.includes(`data-tour="${id}"`), `${guide.id}: ${id}`);
    }
  }
});
test("el progreso se aísla por usuario y empresa y soporta almacenamiento corrupto", () => {
  assert.notEqual(
    progress.guideStorageKey("u1", "org"),
    progress.guideStorageKey("u2", "org"),
  );
  assert.notEqual(
    progress.guideStorageKey("u1", "org"),
    progress.guideStorageKey("u1", "otra"),
  );
  assert.equal(
    Object.keys(progress.parseGuideStorage("no-json").tours).length,
    0,
  );
  assert.equal(
    Object.keys(progress.parseGuideStorage('{"tours":null}').tours).length,
    0,
  );
  const parsed = progress.parseGuideStorage(
    JSON.stringify({
      welcomeSeen: true,
      tours: {
        correcto: { step: 3, completed: false },
        fin: { step: 8, completed: true },
        negativo: { step: -1, completed: false },
        texto: { step: "3", completed: false },
        decimal: { step: 2.5, completed: false },
      },
    }),
  );
  assert.equal(parsed.welcomeSeen, true);
  assert.equal(Object.keys(parsed.tours).length, 2);
  assert.equal(parsed.tours.correcto.step, 3);
  assert.equal(parsed.tours.fin.completed, true);
});
