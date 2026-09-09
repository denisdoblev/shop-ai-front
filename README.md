# ShopAI Frontend

Interfaz web de ShopAI para explorar, comparar y guardar productos, conversar con un asistente y administrar el catálogo. El repositorio está en una etapa temprana: la navegación y la interfaz de autenticación existen, pero la mayoría de las páginas son placeholders y todavía no hay integración con backend ni control de acceso real.

## Stack

- Next.js 16 con App Router
- React 19 y TypeScript estricto
- Tailwind CSS 4
- shadcn/ui sobre Base UI
- React Hook Form y Zod en la interfaz de autenticación
- pnpm 11.22.0

## Desarrollo

```bash
pnpm install
pnpm dev
```

La aplicación queda disponible, por defecto, en <http://localhost:3000>.

Validaciones disponibles:

```bash
pnpm lint
pnpm exec tsc --noEmit
pnpm build
```

No existe aún una suite de tests ni un script `test`.

## Documentación

Empezá por [`docs/README.md`](docs/README.md). Allí se enlazan la arquitectura, las convenciones comprobadas y la guía de desarrollo.

Las instrucciones operativas para agentes están en [`AGENTS.md`](AGENTS.md).
