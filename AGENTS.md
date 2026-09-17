<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# ShopAI: instrucciones operativas

ShopAI es una única aplicación frontend con Next.js 16 App Router. Las rutas públicas y de invitado viven en `app/(auth)` y la carcasa protegida en `app/(authenticated)`. El layout y cada página protegida validan la sesión contra el backend; `proxy.ts` sólo transporta la URL solicitada. La autorización de datos se aplica desde `lib/auth` y en cada operación protegida. La integración HTTP vive en `lib/http`, los contratos generados en `lib/api` y el BFF de autenticación en `app/api/auth`.

## Antes de modificar

- Leé [`docs/README.md`](docs/README.md) y la guía que corresponda: [`docs/architecture.md`](docs/architecture.md), [`docs/conventions.md`](docs/conventions.md) o [`docs/development.md`](docs/development.md).
- Para código de Next.js, además leé la guía relevante de `node_modules/next/dist/docs/`; este proyecto usa APIs de Next 16 que pueden diferir de versiones anteriores.
- Revisá `git status --short`: puede haber trabajo sin confirmar. No sobrescribas ni reformatees cambios ajenos.

## Reglas fundamentales

- Conservá App Router, los route groups `(auth)` y `(authenticated)`, y sus layouts diferenciados.
- Mantené los componentes como Server Components salvo que necesiten estado, efectos, eventos o APIs del navegador; colocá `"use client"` en el límite interactivo más pequeño.
- Usá `@/` para imports entre áreas y rutas relativas dentro de una feature colocada junto a su ruta.
- Reutilizá primero las primitivas instaladas en `components/ui/`. Consultá `components.json` antes de agregar o actualizar componentes shadcn; el proyecto usa el estilo `base-nova`, Base UI, Lucide y Tailwind v4.
- Definí temas y tokens globales en `app/globals.css`; preferí tokens semánticos existentes a colores literales nuevos.
- Reutilizá `lib/http` para requests. El servidor usa `BACKEND_URL`; el navegador usa rutas same-origin del BFF y nunca recibe el JWT almacenado en la cookie `HttpOnly`.
- No agregues un proxy genérico ni expongas `BACKEND_URL` con `NEXT_PUBLIC_`. Los Server Components deben consultar el backend directamente.
- No conviertas las inconsistencias de formato o nombres registradas en `docs/conventions.md` en reglas implícitas. Si el cambio requiere resolverlas, hacé una propuesta separada.

## Validación

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

Los tests usan Vitest y Testing Library. `pnpm lint` analiza también `.agents/`; revisá siempre las rutas de cualquier warning.

Actualizá `docs/` y este archivo cuando un cambio establezca o invalide una arquitectura, un comando, una ruta, una integración o una convención documentada. Mantené `AGENTS.md` breve y enlazá el detalle en `docs/`.

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

When the user types `/graphify`, use the installed graphify skill or instructions before doing anything else.

Rules:
- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- Dirty graphify-out/ files are expected after hooks or incremental updates; dirty graph files are not a reason to skip graphify. Only skip graphify if the task is about stale or incorrect graph output, or the user explicitly says not to use it.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).
