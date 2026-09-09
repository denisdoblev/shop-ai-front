# Arquitectura

## Alcance y madurez

El repositorio contiene una sola aplicación frontend, no un monorepo de aplicaciones o paquetes. `pnpm-workspace.yaml` configura builds permitidos de pnpm, pero no declara `packages`; `package.json` es el único manifiesto del proyecto.

La aplicación usa Next.js 16.3.4, React 19.2.8 y App Router. Su estado actual es el de una base de interfaz: hay layouts, navegación, tema, componentes compartidos y formularios de acceso, pero no hay backend ni integración HTTP. Las etiquetas de rutas describen intención de producto, no capacidades terminadas.

## Estructura principal

```text
app/
├── layout.tsx                    # documento HTML, fuentes y metadata global
├── globals.css                   # Tailwind v4, tokens y estilos base
├── (auth)/
│   ├── layout.tsx                # superficie visual de acceso
│   ├── login/page.tsx            # /login
│   ├── register/page.tsx         # /register
│   ├── forgot-password/page.tsx  # /forgot-password (placeholder)
│   ├── privacy/page.tsx          # /privacy (placeholder)
│   ├── terms/page.tsx            # /terms (placeholder)
│   ├── _components/              # UI privada de la feature
│   ├── _lib/AuthFormSchema.ts    # schema Zod compartido
│   └── types/Auth.ts             # tipos de la feature
└── (authenticated)/
    ├── layout.tsx                # sidebar y navegación superior
    ├── page.tsx                  # /
    ├── assistant/page.tsx        # /assistant
    ├── compare/page.tsx          # /compare
    ├── explore/page.tsx          # /explore
    ├── history/page.tsx          # /history
    ├── saved/page.tsx            # /saved
    └── admin/                    # /admin y mantenimiento de catálogo
components/
├── AppSidebar/                   # navegación lateral de producto
├── TopNavigation/                # barra superior de producto
└── ui/                           # primitivas shadcn instaladas como código fuente
hooks/use-mobile.ts               # detección responsive usada por Sidebar
lib/utils.ts                      # reexport de cn
public/                           # assets estáticos heredados de create-next-app
```

Los directorios entre paréntesis son route groups: organizan y aplican layouts sin aparecer en la URL. Los directorios `_components` y `_lib` marcan detalles privados de la feature de autenticación. Evidencia: `app/(auth)/layout.tsx`, `app/(authenticated)/layout.tsx` y `app/(auth)/_components/AuthForm.tsx`.

## Jerarquía de layouts

```text
app/layout.tsx
├── app/(auth)/layout.tsx
│   ├── /login
│   ├── /register
│   └── /forgot-password, /privacy, /terms
└── app/(authenticated)/layout.tsx
    ├── /
    ├── /explore, /compare, /assistant, /saved, /history
    └── /admin y /admin/*
```

`app/layout.tsx` define `lang="es"`, metadata de ShopAI y las fuentes Inter, Geist y Geist Mono. `app/(auth)/layout.tsx` aplica una superficie visual independiente. `app/(authenticated)/layout.tsx` compone `SidebarProvider`, `AppSidebar`, `SidebarInset` y `TopNavigation`.

El layout llamado `(authenticated)` **no protege rutas**. Sólo lee la cookie `sidebar_state` con `await cookies()` para restaurar la apertura del sidebar. No consulta identidad, sesión ni roles. La escritura de esa cookie ocurre en el componente cliente `SidebarProvider` de `components/ui/sidebar.tsx`.

## Límites Server/Client

Los layouts y páginas son Server Components por defecto. `app/(authenticated)/layout.tsx` es `async` porque usa la API asíncrona `cookies()` de Next 16.

Los límites cliente aparecen donde existe interactividad o una primitiva que la necesita:

- `components/AppSidebar/AppSidebar.tsx` usa `usePathname()` para marcar navegación activa.
- `app/(auth)/_components/AuthForm.tsx` usa React Hook Form.
- `app/(auth)/_components/PasswordField.tsx` usa `useState()`.
- varias primitivas de `components/ui/` declaran `"use client"` por depender de Base UI, contexto o hooks.

`AuthShell` y `TextField` no declaran la directiva. Pueden renderizarse desde el árbol cliente de `AuthForm`, pero también permanecen utilizables desde el servidor mientras sus props sean serializables y sus dependencias lo permitan. La directiva se mantiene en los puntos interactivos, no en todas las hojas por anticipado.

## Capas y responsabilidades actuales

| Zona | Responsabilidad | Evidencia |
| --- | --- | --- |
| `app/**/page.tsx` | entrada de cada URL y metadata específica cuando existe | `app/(auth)/login/page.tsx`, `app/(authenticated)/explore/page.tsx` |
| `app/**/layout.tsx` | composición persistente por grupo de rutas | `app/layout.tsx`, `app/(authenticated)/layout.tsx` |
| `app/(auth)/_components` | componentes exclusivos de autenticación | `AuthForm.tsx`, `AuthShell.tsx`, `PasswordField.tsx`, `TextField.tsx` |
| `components/AppSidebar`, `components/TopNavigation` | componentes de producto compartidos entre rutas | `components/AppSidebar/AppSidebar.tsx`, `components/TopNavigation/TopNavigation.tsx` |
| `components/ui` | primitivas shadcn/Base UI reutilizables | `button.tsx`, `field.tsx`, `sidebar.tsx` |
| `hooks` | hooks compartidos | `hooks/use-mobile.ts` |
| `lib` | utilidades compartidas mínimas | `lib/utils.ts` |

No existen hoy carpetas o archivos de servicios, controllers, DTOs, entities, repositorios, schemas de persistencia ni clientes HTTP. `AuthFormSchema.ts` es un schema de validación de formulario, no un contrato de backend.

## Flujos implementados

### Navegación y sidebar

`AppSidebar.tsx` contiene dos arreglos estáticos, `workspaceItems` y `administrationItems`, que son la fuente actual de enlaces. Usa `next/link` y compara cada URL con `usePathname()`. El provider de `components/ui/sidebar.tsx` administra el estado responsive y persiste `sidebar_state`; el layout del servidor recupera esa preferencia en la siguiente petición.

### Formularios de acceso

`/login` y `/register` pasan un discriminante `mode` a `AuthShell` y `AuthForm`. `/forgot-password`, `/privacy` y `/terms` son placeholders públicos accesibles que evitan enlaces rotos, pero no implementan flujos ni contenido legal definitivo. `AuthForm.tsx`:

1. crea el formulario con React Hook Form;
2. valida con `zodResolver(authFormSchema)`;
3. registra inputs de texto directamente y adapta `Checkbox` mediante `Controller`;
4. muestra errores con `FieldError` y atributos `aria-invalid`/`aria-describedby`.

El submit ejecuta actualmente `handleSubmit(() => undefined)`. No envía datos ni crea sesión. El mensaje accesible posterior al submit confirma que la conexión está pendiente.

## Áreas todavía no definidas

- autenticación, autorización y protección de rutas;
- API o backend de origen;
- estrategia de fetching, cache, mutaciones y manejo de errores remotos;
- modelo de datos del catálogo y DTOs;
- estado global de aplicación;
- estrategia de testing;
- despliegue y variables de entorno;
- límites de dominio entre administración, catálogo y asistente.

Hasta que aparezca una implementación repetida o una decisión explícita, ninguna estructura para esas áreas debe considerarse parte de la arquitectura.
