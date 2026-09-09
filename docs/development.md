# Desarrollo y validación

## Requisitos comprobables

- Gestor: pnpm 11.22.0, fijado en `package.json` mediante `packageManager`.
- Framework: Next.js 16.3.4.
- TypeScript 5, React 19 y Tailwind CSS 4 según `package.json`.

El repositorio no contiene `.nvmrc`, `.node-version` ni campo `engines`; por lo tanto no hay una versión de Node formalmente definida. No deducirla de `@types/node` ni del entorno local de una sesión.

## Instalación y ejecución

```bash
pnpm install
pnpm dev
```

`pnpm dev` ejecuta `next dev`. La URL predeterminada es <http://localhost:3000>.

Para probar el artefacto de producción:

```bash
pnpm build
pnpm start
```

`pnpm start` requiere haber generado antes el build.

## Validaciones disponibles

```bash
pnpm lint
pnpm exec tsc --noEmit
pnpm build
```

- `pnpm lint` ejecuta ESLint con Core Web Vitals y reglas TypeScript de Next.
- `pnpm exec tsc --noEmit` realiza el chequeo de tipos usando `tsconfig.json`. No hay alias de script para typecheck.
- `pnpm build` valida la compilación de producción de Next.

Ejecutá como mínimo lint y typecheck después de cambios de TypeScript/React. Ejecutá también build al cambiar rutas, layouts, configuración, fuentes o límites Server/Client.

### Alcance actual del lint

`eslint.config.mjs` sólo ignora `.next/**`, `out/**`, `build/**` y `next-env.d.ts`. Por eso `pnpm lint` también inspecciona archivos TypeScript/TSX dentro de `.agents/`. En el análisis inicial terminó con código de salida correcto y tres warnings `no-unused-vars` en `.agents/skills/tailwind-v4-shadcn/templates/theme-provider.tsx`; no eran avisos del código de la aplicación.

Al informar una validación, indicá tanto su código de salida como las rutas de cualquier warning. No afirmar “sin problemas” si hay warnings, aunque sean ajenos a la feature.

## Testing

No existen:

- script `test` en `package.json`;
- archivos `*.test.*` o `*.spec.*` de la aplicación;
- configuración de Jest, Vitest o Playwright;
- mocks, fixtures o cobertura versionados.

Por lo tanto, no hay estrategia de testing establecida ni un comando de tests válido. Agregar tests exige elegir primero herramienta, alcance y convenciones; esa elección debe documentarse cuando ocurra.

## Configuración relevante

| Archivo | Función |
| --- | --- |
| `package.json` | scripts, dependencias y versión de pnpm |
| `pnpm-lock.yaml` | resolución reproducible de dependencias |
| `pnpm-workspace.yaml` | permisos de scripts nativos; no declara paquetes de monorepo |
| `tsconfig.json` | TypeScript estricto, plugin Next y alias `@/*` |
| `eslint.config.mjs` | flat config de ESLint para Next y TypeScript |
| `next.config.ts` | configuración Next actualmente vacía |
| `postcss.config.mjs` | plugin `@tailwindcss/postcss` |
| `components.json` | configuración de shadcn y destinos de componentes |
| `app/globals.css` | imports Tailwind/shadcn, tema y tokens globales |

No existe configuración de Prettier.

## Variables de entorno y servicios

`.gitignore` excluye `.env*`, pero el código no referencia `process.env` y no hay plantilla `.env.example`. Tampoco hay Docker, configuración de infraestructura ni llamadas a servicios externos.

No documentar nombres de variables hasta que aparezcan en una plantilla segura o en código/configuración versionados. Nunca copiar valores secretos a la documentación.

## Documentación y cambios

Antes de editar, revisar:

```bash
git status --short
```

El árbol puede contener trabajo no confirmado. Limitar los cambios al alcance pedido y no usar formateo global. Si una feature agrega rutas, comandos, integraciones o patrones repetibles, actualizar `docs/architecture.md`, `docs/conventions.md` o este archivo y mantener `AGENTS.md` como índice operativo breve.
