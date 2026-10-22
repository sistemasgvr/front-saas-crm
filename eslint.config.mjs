import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    // Salidas de builds alternos (QA / usuarios): código generado.
    ".next-*/**",
    // Librería de terceros ya minificada (grabación de notas de voz).
    "public/opus-recorder/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Plantilla de referencia — no se ejecuta ni se despliega (PLAN.md §2/§6.2).
    "free-nextjs-admin-dashboard-main/**",
  ]),
  {
    // Scripts de build en Node CommonJS: `require` es lo correcto ahí.
    files: ["scripts/**/*.cjs"],
    rules: { "@typescript-eslint/no-require-imports": "off" },
  },
  {
    // Convención del proyecto: prefijo _ = parámetro/variable sin usar a propósito.
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
          ignoreRestSiblings: true,
        },
      ],
    },
  },
]);

export default eslintConfig;
