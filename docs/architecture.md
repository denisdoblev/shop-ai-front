# Arquitectura

## Alcance y madurez

El repositorio contiene una sola aplicación frontend, no un monorepo de aplicaciones o paquetes. `pnpm-workspace.yaml` configura builds permitidos de pnpm, pero no declara `packages`; `package.json` es el único manifiesto del proyecto.

La aplicación usa Next.js 16.3.4, React 19.2.8 y App Router. Hay layouts, navegación, tema, componentes compartidos y autenticación integrada con el backend. El catálogo y las demás áreas de producto continúan mayormente como placeholders.

## Estructura principal

```text
app/
├── layout.tsx                    # documento HTML, fuentes y metadata global
├── globals.css                   # Tailwind v4, tokens y estilos base
├── (auth)/
│   ├── layout.tsx                # superficie visual de acceso
│   ├── (guest)/                   # rutas exclusivas de usuarios sin sesión
│   │   ├── layout.tsx            # redirige sesiones válidas a /
│   │   ├── login/page.tsx        # /login
│   │   ├── register/page.tsx     # /register
│   │   └── forgot-password/page.tsx # /forgot-password (placeholder)
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
lib/http/                         # fetch tipado y clientes server/client
lib/api/generated.ts             # contrato generado desde OpenAPI
lib/auth/                         # services de auth, sesión y helpers BFF
lib/query/                        # QueryClient y query keys
app/api/auth/                     # BFF de login, registro, sesión y logout
public/                           # assets estáticos heredados de create-next-app
proxy.ts                          # propaga la URL solicitada a los guards
```

Los directorios entre paréntesis son route groups: organizan y aplican layouts sin aparecer en la URL. Los directorios `_components` y `_lib` marcan detalles privados de la feature de autenticación. Evidencia: `app/(auth)/layout.tsx`, `app/(authenticated)/layout.tsx` y `app/(auth)/_components/AuthForm.tsx`.

## Jerarquía de layouts

```text
app/layout.tsx
├── app/(auth)/layout.tsx
│   ├── app/(auth)/(guest)/layout.tsx
│   │   └── /login, /register, /forgot-password
│   └── /privacy, /terms
└── app/(authenticated)/layout.tsx
    ├── /                                      # vuelve a validar la sesión
    ├── /explore, /compare, /assistant, /saved, /history
    └── /admin y /admin/*                     # cada page vuelve a validarla
```

`app/layout.tsx` define `lang="es"`, metadata de ShopAI y las fuentes Inter, Geist y Geist Mono. `app/(auth)/layout.tsx` aplica una superficie visual independiente y su grupo `(guest)` comprueba que no exista una sesión válida. `app/(authenticated)/layout.tsx` exige una sesión válida antes de componer `SidebarProvider`, `AppSidebar`, `SidebarInset` y `TopNavigation`; cada `page.tsx` del grupo repite el guard porque Next.js conserva el layout durante navegaciones cliente. El layout raíz conserva su naturaleza de Server Component y delega solamente el contexto de TanStack Query al Client Component `app/providers.tsx`.

Los guards consultan `GET /api/auth/check-status` mediante `lib/auth`, por lo que la presencia de `shopai_session` por sí sola no autoriza navegación. Una ausencia de cookie o cualquier fallo de validación se trata como sesión inválida. El layout y las páginas protegidas redirigen a `/login` y conservan la ruta interna solicitada; el layout de invitados redirige sesiones válidas a `/`. `getCurrentUser()` se memoiza durante cada render de servidor para evitar duplicar la consulta cuando layout y página validan juntos. `/privacy` y `/terms` permanecen fuera del guard de invitados.

`proxy.ts` no valida la sesión ni llama al backend. Sólo sobrescribe un header interno con el pathname y query de cada navegación de página para que los guards protegidos puedan construir `returnTo`; excluye APIs y recursos estáticos. La autorización efectiva se aplica en el servidor y debe repetirse cerca de cualquier acceso protegido a datos.

## Límites Server/Client

Los layouts y páginas son Server Components por defecto. Los layouts de sesión y las páginas protegidas son `async` porque usan las APIs asíncronas `cookies()`/`headers()` de Next 16 y validan la sesión en el servidor.

Los límites cliente aparecen donde existe interactividad o una primitiva que la necesita:

- `components/AppSidebar/AppSidebar.tsx` usa `usePathname()` para marcar navegación activa.
- `app/(auth)/_components/AuthForm.tsx` usa React Hook Form.
- `app/(auth)/_components/PasswordField.tsx` usa `useState()`.
- varias primitivas de `components/ui/` declaran `"use client"` por depender de Base UI, contexto o hooks.

`AuthShell` y `TextField` no declaran la directiva. Pueden renderizarse desde el árbol cliente de `AuthForm`, pero también permanecen utilizables desde el servidor mientras sus props sean serializables y sus dependencias lo permitan. La directiva se mantiene en los puntos interactivos, no en todas las hojas por anticipado.

## Capas y responsabilidades actuales

| Zona | Responsabilidad | Evidencia |
| --- | --- | --- |
| `app/**/page.tsx` | entrada de cada URL y metadata específica cuando existe | `app/(auth)/(guest)/login/page.tsx`, `app/(authenticated)/explore/page.tsx` |
| `app/**/layout.tsx` | composición persistente por grupo de rutas | `app/layout.tsx`, `app/(authenticated)/layout.tsx` |
| `app/(auth)/_components` | componentes exclusivos de autenticación | `AuthForm.tsx`, `AuthShell.tsx`, `PasswordField.tsx`, `TextField.tsx` |
| `components/AppSidebar`, `components/TopNavigation` | componentes de producto compartidos entre rutas | `components/AppSidebar/AppSidebar.tsx`, `components/TopNavigation/TopNavigation.tsx` |
| `components/ui` | primitivas shadcn/Base UI reutilizables | `button.tsx`, `field.tsx`, `sidebar.tsx` |
| `hooks` | hooks compartidos | `hooks/use-mobile.ts` |
| `lib/http`, `lib/api`, `lib/auth`, `lib/query` | HTTP compartido, contrato OpenAPI, sesión y server state | `lib/http/request.ts`, `lib/api/generated.ts` |

`lib/http/request.ts` implementa la base sobre `fetch`; `lib/http/server.ts` resuelve la URL privada del backend y `lib/http/client.ts` consume URLs relativas same-origin. `lib/api/generated.ts` se genera desde Swagger y no se edita manualmente. `AuthFormSchema.ts` sigue siendo validación de interfaz, no un DTO mantenido a mano.

## Flujo HTTP y sesión

```text
Server Component ── lib/http/server ──────────────> backend
Client Component ── TanStack Query ──> /api/auth/* ──> backend
                                           │
                                           └── cookie shopai_session HttpOnly
```

El backend devuelve un JWT Bearer en el body y no habilita CORS. Por eso el navegador no lo llama directamente: los Route Handlers de autenticación guardan el token en una cookie `HttpOnly`, devuelven sólo el perfil seguro y trasladan los errores HTTP sin revelar secretos. El Proxy no actúa como proxy HTTP ni maneja el JWT. El helper `authenticatedServerRequest` añade el Bearer desde la cookie sólo en código servidor y mantiene esa dependencia separada del cliente HTTP general.

Las peticiones de autenticación usan `cache: "no-store"`. La capa servidor acepta las opciones de caché y revalidación de Next para que futuros recursos públicos decidan su política por operación.

## Flujos implementados

### Navegación y sidebar

`AppSidebar.tsx` contiene dos arreglos estáticos, `workspaceItems` y `administrationItems`, que son la fuente actual de enlaces. Usa `next/link` y compara cada URL con `usePathname()`. El provider de `components/ui/sidebar.tsx` administra el estado responsive y persiste `sidebar_state`; el layout del servidor recupera esa preferencia en la siguiente petición.

### Formularios de acceso

`/login` y `/register` pasan un discriminante `mode` y un destino interno validado a `AuthShell` y `AuthForm`. `/forgot-password` es exclusiva de invitados; `/privacy` y `/terms` siguen siendo placeholders públicos. Estas rutas evitan enlaces rotos, pero no implementan flujos ni contenido legal definitivo. `AuthForm.tsx`:

1. crea el formulario con React Hook Form;
2. valida con `zodResolver(authFormSchema)`, una unión discriminada que sólo aplica la complejidad de contraseña al registro;
3. registra inputs de texto directamente y adapta `Checkbox` mediante `Controller`;
4. muestra errores con `FieldError` y atributos `aria-invalid`/`aria-describedby`.

El submit usa `useLogin` o `useRegister`. Registro transforma nombre y apellidos a `fullname`; términos y preferencia de recuerdo no se envían al backend. En éxito actualiza la query de sesión y navega a la ruta interna solicitada, o a `/` si no existe una segura. Los errores de validación, credenciales, conflicto y red se presentan de forma accesible.

## Áreas todavía no definidas

- autorización por roles y protección de operaciones de datos;
- modelo de datos del catálogo y DTOs;
- estado global de aplicación fuera del server state administrado por TanStack Query;
- despliegue y variables de entorno;
- límites de dominio entre administración, catálogo y asistente.

El backend no expone refresh token ni revocación/logout. El logout del frontend sólo elimina la cookie local, y “Recuérdame” nunca extiende las dos horas de vigencia del JWT.
