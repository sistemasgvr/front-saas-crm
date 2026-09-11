"use client";

import {
  Fragment,
  type ReactNode,
  createElement,
} from "react";
import { textoWhatsAppPlano } from "./texto-whatsapp-plano";

export { textoWhatsAppPlano };

type InlineKind = "bold" | "italic" | "strike" | "code" | "mono";

const LINK_CLASS =
  "underline underline-offset-2 break-all hover:opacity-90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-current/40 rounded-sm";

const CODE_CLASS =
  "rounded px-1 py-0.5 font-mono text-[0.92em] bg-black/10 dark:bg-white/15";

const MONO_CLASS =
  "block whitespace-pre-wrap break-words rounded-md px-2 py-1.5 font-mono text-[0.92em] bg-black/10 dark:bg-white/15";

/** URL http(s) o www. — recorta puntuación final típica. */
const RE_URL =
  /(?:https?:\/\/|www\.)[^\s<>"'`]+/gi;

const RE_EMAIL =
  /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

/** Teléfonos internacionales / locales (mín. ~8 dígitos). */
const RE_PHONE =
  /(?<![A-Za-z0-9])(?:\+|00)?(?:\d[\s\-().]*){7,16}\d(?![A-Za-z0-9])/g;

function recortarPuntuacionUrl(raw: string): { url: string; trailing: string } {
  let url = raw;
  let trailing = "";
  while (url.length > 0) {
    const ch = url.slice(-1);
    if (!/[),.;:!?]$/.test(ch)) break;
    if (ch === ")") {
      const abiertos = (url.match(/\(/g) ?? []).length;
      const cerrados = (url.match(/\)/g) ?? []).length;
      if (abiertos >= cerrados) break;
    }
    trailing = ch + trailing;
    url = url.slice(0, -1);
  }
  return { url, trailing };
}

function hrefDeUrl(raw: string): string {
  return /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
}

function hrefTelefono(raw: string): string {
  const digitos = raw.replace(/[^\d+]/g, "");
  const normalizado = digitos.startsWith("00")
    ? `+${digitos.slice(2)}`
    : digitos;
  return `tel:${normalizado}`;
}

function esTelefonoValido(raw: string): boolean {
  const digitos = raw.replace(/\D/g, "");
  return digitos.length >= 8 && digitos.length <= 15;
}

/** Encuentra el match más temprano entre varios regex (con lastIndex reset). */
function primerMatch(
  texto: string,
  desde: number,
  patrones: { kind: string; re: RegExp }[],
): { kind: string; index: number; match: RegExpExecArray } | null {
  let mejor: { kind: string; index: number; match: RegExpExecArray } | null =
    null;
  for (const { kind, re } of patrones) {
    re.lastIndex = desde;
    const m = re.exec(texto);
    if (!m || m.index < desde) continue;
    if (!mejor || m.index < mejor.index) {
      mejor = { kind, index: m.index, match: m };
    }
  }
  return mejor;
}

function renderInline(texto: string, keyPrefix: string): ReactNode[] {
  if (!texto) return [];

  const nodos: ReactNode[] = [];
  let i = 0;
  let autoKey = 0;
  const key = () => `${keyPrefix}-${autoKey++}`;

  // Orden: mono bloque ya se extrajo a nivel superior; aquí inline.
  // ** antes que * para no partir negrita markdown.
  const formatos: { kind: InlineKind | "bold2"; re: RegExp }[] = [
    { kind: "code", re: /`([^`\n]+?)`/g },
    // **negrita** (markdown habitual; WhatsApp oficial usa *una*)
    { kind: "bold2", re: /(?<![A-Za-z0-9])\*\*(?!\s)([\s\S]+?)(?<!\s)\*\*(?![A-Za-z0-9])/g },
    { kind: "bold", re: /(?<![A-Za-z0-9*])\*(?!\s|\*)([^*\n]+?)(?<!\s|\*)\*(?![A-Za-z0-9*])/g },
    { kind: "italic", re: /(?<![A-Za-z0-9_])_(?!\s)([^_\n]+?)(?<!\s)_(?![A-Za-z0-9_])/g },
    { kind: "strike", re: /(?<![A-Za-z0-9~])~(?!\s)([^~\n]+?)(?<!\s)~(?![A-Za-z0-9~])/g },
  ];

  const enlaces: { kind: string; re: RegExp }[] = [
    { kind: "url", re: new RegExp(RE_URL.source, "gi") },
    { kind: "email", re: new RegExp(RE_EMAIL.source, "g") },
    { kind: "phone", re: new RegExp(RE_PHONE.source, "g") },
  ];

  while (i < texto.length) {
    const fmt = primerMatch(texto, i, formatos);
    const link = primerMatch(texto, i, enlaces);

    // Elegir el que empieza antes; si empate, formato gana sobre link
    // (p.ej. *https://x.com* → negrita con URL dentro).
    let elegido: typeof fmt = null;
    if (fmt && link) {
      elegido = fmt.index <= link.index ? fmt : link;
    } else {
      elegido = fmt ?? link;
    }

    if (!elegido) {
      nodos.push(texto.slice(i));
      break;
    }

    if (elegido.index > i) {
      nodos.push(texto.slice(i, elegido.index));
    }

    const m = elegido.match;
    const contenido = m[1] ?? m[0];

    if (elegido.kind === "url") {
      const { url, trailing } = recortarPuntuacionUrl(m[0]);
      nodos.push(
        <a
          key={key()}
          href={hrefDeUrl(url)}
          target="_blank"
          rel="noopener noreferrer"
          className={LINK_CLASS}
          onClick={(e) => e.stopPropagation()}
        >
          {url}
        </a>,
      );
      if (trailing) nodos.push(trailing);
      i = elegido.index + m[0].length;
      continue;
    }

    if (elegido.kind === "email") {
      nodos.push(
        <a
          key={key()}
          href={`mailto:${m[0]}`}
          className={LINK_CLASS}
          onClick={(e) => e.stopPropagation()}
        >
          {m[0]}
        </a>,
      );
      i = elegido.index + m[0].length;
      continue;
    }

    if (elegido.kind === "phone") {
      if (!esTelefonoValido(m[0])) {
        nodos.push(m[0]);
        i = elegido.index + m[0].length;
        continue;
      }
      nodos.push(
        <a
          key={key()}
          href={hrefTelefono(m[0])}
          className={LINK_CLASS}
          onClick={(e) => e.stopPropagation()}
        >
          {m[0]}
        </a>,
      );
      i = elegido.index + m[0].length;
      continue;
    }

    if (elegido.kind === "code") {
      nodos.push(
        <code key={key()} className={CODE_CLASS}>
          {contenido}
        </code>,
      );
      i = elegido.index + m[0].length;
      continue;
    }

    const tag =
      elegido.kind === "bold" || elegido.kind === "bold2"
        ? "strong"
        : elegido.kind === "italic"
          ? "em"
          : "s";

    nodos.push(
      createElement(
        tag,
        { key: key(), className: elegido.kind === "bold" || elegido.kind === "bold2" ? "font-semibold" : undefined },
        ...renderInline(contenido, key()),
      ),
    );
    i = elegido.index + m[0].length;
  }

  return nodos;
}

type Bloque =
  | { tipo: "p"; lineas: string[] }
  | { tipo: "quote"; lineas: string[] }
  | { tipo: "ul"; items: string[] }
  | { tipo: "ol"; items: string[] }
  | { tipo: "mono"; texto: string };

function esBullet(linea: string): string | null {
  const m = /^(?:[-*]|\u2022)\s+(.*)$/.exec(linea);
  return m ? m[1] : null;
}

function esNumerada(linea: string): string | null {
  const m = /^(\d+)\.\s+(.*)$/.exec(linea);
  return m ? m[2] : null;
}

function esCita(linea: string): string | null {
  const m = /^>\s?(.*)$/.exec(linea);
  return m ? m[1] : null;
}

function agruparLineas(lineas: string[]): Bloque[] {
  const bloques: Bloque[] = [];
  let i = 0;

  while (i < lineas.length) {
    const linea = lineas[i]!;

    const cita = esCita(linea);
    if (cita !== null) {
      const grupo: string[] = [cita];
      i += 1;
      while (i < lineas.length) {
        const c = esCita(lineas[i]!);
        if (c === null) break;
        grupo.push(c);
        i += 1;
      }
      bloques.push({ tipo: "quote", lineas: grupo });
      continue;
    }

    const bullet = esBullet(linea);
    if (bullet !== null) {
      const items: string[] = [bullet];
      i += 1;
      while (i < lineas.length) {
        const b = esBullet(lineas[i]!);
        if (b === null) break;
        items.push(b);
        i += 1;
      }
      bloques.push({ tipo: "ul", items });
      continue;
    }

    const num = esNumerada(linea);
    if (num !== null) {
      const items: string[] = [num];
      i += 1;
      while (i < lineas.length) {
        const n = esNumerada(lineas[i]!);
        if (n === null) break;
        items.push(n);
        i += 1;
      }
      bloques.push({ tipo: "ol", items });
      continue;
    }

    // Párrafo: líneas normales hasta el próximo bloque especial o línea vacía
    // (línea vacía = salto visual).
    if (linea === "") {
      bloques.push({ tipo: "p", lineas: [""] });
      i += 1;
      continue;
    }

    const grupo: string[] = [linea];
    i += 1;
    while (i < lineas.length) {
      const sig = lineas[i]!;
      if (
        sig === "" ||
        esCita(sig) !== null ||
        esBullet(sig) !== null ||
        esNumerada(sig) !== null
      ) {
        break;
      }
      grupo.push(sig);
      i += 1;
    }
    bloques.push({ tipo: "p", lineas: grupo });
  }

  return bloques;
}

/** Separa ```monospace``` del resto del mensaje. */
function segmentarMonospace(texto: string): Bloque[] {
  const bloques: Bloque[] = [];
  const re = /```([\s\S]*?)```/g;
  let ultimo = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(texto)) !== null) {
    if (m.index > ultimo) {
      const trozo = texto.slice(ultimo, m.index);
      bloques.push(...agruparLineas(trozo.split("\n")));
    }
    bloques.push({ tipo: "mono", texto: m[1] ?? "" });
    ultimo = m.index + m[0].length;
  }
  if (ultimo < texto.length) {
    bloques.push(...agruparLineas(texto.slice(ultimo).split("\n")));
  }
  return bloques;
}

function renderLineasConSaltos(
  lineas: string[],
  keyPrefix: string,
): ReactNode {
  return lineas.map((linea, idx) => (
    <Fragment key={`${keyPrefix}-l${idx}`}>
      {idx > 0 ? <br /> : null}
      {linea === "" ? null : renderInline(linea, `${keyPrefix}-i${idx}`)}
    </Fragment>
  ));
}

function renderBloques(bloques: Bloque[]): ReactNode[] {
  return bloques.map((b, idx) => {
    const k = `b${idx}`;
    switch (b.tipo) {
      case "mono":
        return (
          <code key={k} className={MONO_CLASS}>
            {b.texto}
          </code>
        );
      case "quote":
        return (
          <blockquote
            key={k}
            className="my-0.5 border-l-[3px] border-current/35 pl-2 opacity-95"
          >
            {renderLineasConSaltos(b.lineas, k)}
          </blockquote>
        );
      case "ul":
        return (
          <ul key={k} className="my-0.5 list-disc space-y-0.5 pl-4">
            {b.items.map((item, j) => (
              <li key={`${k}-${j}`}>{renderInline(item, `${k}-u${j}`)}</li>
            ))}
          </ul>
        );
      case "ol":
        return (
          <ol key={k} className="my-0.5 list-decimal space-y-0.5 pl-4">
            {b.items.map((item, j) => (
              <li key={`${k}-${j}`}>{renderInline(item, `${k}-o${j}`)}</li>
            ))}
          </ol>
        );
      case "p":
        if (b.lineas.length === 1 && b.lineas[0] === "") {
          return <div key={k} className="h-2" aria-hidden />;
        }
        return (
          <span key={k} className="block">
            {renderLineasConSaltos(b.lineas, k)}
          </span>
        );
    }
  });
}

export default function TextoWhatsApp({
  texto,
  className = "",
}: {
  texto: string;
  className?: string;
}) {
  if (!texto) return null;
  const bloques = segmentarMonospace(texto);

  return (
    <div
      className={`break-words [overflow-wrap:anywhere] [&_a]:underline ${className}`}
    >
      {renderBloques(bloques)}
    </div>
  );
}
