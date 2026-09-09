<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# ShopAI: instrucciones operativas

ShopAI es una única aplicación frontend con Next.js 16 App Router. Las rutas públicas de autenticación viven en `app/(auth)` y la carcasa principal en `app/(authenticated)`. El nombre de este último grupo es organizativo: actualmente no implementa autenticación ni autorización. No hay backend, route handlers, Server Actions ni capa de datos en este repositorio.

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
- No inventes una capa de servicios, API, persistencia, autenticación o autorización: esas decisiones siguen pendientes.
- No conviertas las inconsistencias de formato o nombres registradas en `docs/conventions.md` en reglas implícitas. Si el cambio requiere resolverlas, hacé una propuesta separada.

## Validación

```bash
pnpm lint
pnpm exec tsc --noEmit
pnpm build
```

No hay tests automatizados. `pnpm lint` analiza también `.agents/` y actualmente puede informar warnings ajenos al código de la aplicación; revisá siempre las rutas del reporte.

Actualizá `docs/` y este archivo cuando un cambio establezca o invalide una arquitectura, un comando, una ruta, una integración o una convención documentada. Mantené `AGENTS.md` breve y enlazá el detalle en `docs/`.
