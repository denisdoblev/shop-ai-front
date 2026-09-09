# ShopAI Frontend

Interfaz web de ShopAI para explorar, comparar y guardar productos, conversar con un asistente y administrar el catálogo. El registro y el login están integrados con el backend mediante un BFF mínimo de Next.js; el grupo `(authenticated)` valida la sesión en su layout y en cada página protegida, aunque la mayoría de las páginas de producto todavía son placeholders.

## Stack

- Next.js 16 con App Router
- React 19 y TypeScript estricto
- Tailwind CSS 4
- shadcn/ui sobre Base UI
- React Hook Form y Zod en la interfaz de autenticación
- TanStack Query para server state en componentes cliente
- pnpm 11.22.0

## Desarrollo

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

El backend debe ejecutarse en <http://localhost:3000>. La aplicación queda disponible en <http://localhost:3001>.

Validaciones disponibles:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

Con el backend local activo, `pnpm api:types` vuelve a generar los tipos del contrato OpenAPI.

## Documentación

Empezá por [`docs/README.md`](docs/README.md). Allí se enlazan la arquitectura, las convenciones comprobadas y la guía de desarrollo.

Las instrucciones operativas para agentes están en [`AGENTS.md`](AGENTS.md).
