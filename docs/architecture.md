# Arquitectura

## Alcance y madurez

El repositorio contiene una sola aplicación frontend, no un monorepo de aplicaciones o paquetes. `pnpm-workspace.yaml` configura builds permitidos de pnpm, pero no declara `packages`; `package.json` es el único manifiesto del proyecto.

La aplicación usa Next.js 16.3.4, React 19.2.8 y App Router. Hay layouts, navegación, tema, componentes compartidos y autenticación integrada con el backend. La administración de brands, categorías y atributos está implementada; las demás áreas de producto continúan mayormente como placeholders.

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
│   └── _types/Auth.ts            # tipos privados de la feature
└── (authenticated)/
    ├── layout.tsx                # sidebar y navegación superior
    ├── page.tsx                  # /
    ├── assistant/page.tsx        # /assistant
    ├── compare/page.tsx          # /compare
    ├── explore/page.tsx          # /explore
    ├── history/page.tsx          # /history
    ├── saved/page.tsx            # /saved
    └── admin/                    # /admin y mantenimiento de catálogo
        ├── brands/               # listado, /new y /[id]/edit
        ├── categories/           # listado jerárquico, /new, /[id]/edit y acciones
        ├── attributes/           # listado, /new, /[id]/edit y acciones tipadas
        └── products/             # listado filtrable, /new, /[id]/edit y especificaciones
components/
├── AppSidebar/                   # navegación lateral de producto
├── CrudTable/                    # tabla CRUD genérica con búsqueda, acciones y paginación
│   └── _types/types.ts           # contratos tipados internos de la tabla
├── TopNavigation/                # barra superior de producto
└── ui/                           # primitivas shadcn instaladas como código fuente
hooks/use-mobile.ts               # detección responsive usada por Sidebar
lib/utils.ts                      # reexport de cn
lib/http/                         # fetch tipado y clientes server/client
lib/api/generated.ts             # contrato generado desde OpenAPI
lib/auth/                         # services de auth, sesión y helpers BFF
lib/query/                        # QueryClient y query keys
app/api/auth/                     # BFF de login, registro, sesión y logout
app/api/admin/categories/[id]/attributes/ # BFF autenticado de plantillas
public/                           # assets estáticos heredados de create-next-app
proxy.ts                          # propaga la URL solicitada a los guards
```

Los directorios entre paréntesis son route groups: organizan y aplican layouts sin aparecer en la URL. Los directorios de implementación llevan prefijo `_`, incluidos `_components`, `_hooks`, `_lib` y `_types`; dentro de `app/`, Next.js los excluye explícitamente del sistema de rutas. Evidencia: `app/(auth)/_components/AuthForm.tsx`, `app/(auth)/_types/Auth.ts` y los módulos administrativos colocados junto a sus rutas.

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

`app/layout.tsx` define `lang="es"`, metadata de ShopAI y las fuentes Inter, Geist y Geist Mono. `app/(auth)/layout.tsx` aplica una superficie visual independiente y su grupo `(guest)` comprueba que no exista una sesión válida. `app/(authenticated)/layout.tsx` exige una sesión válida antes de componer `SidebarProvider`, `AppSidebar`, `SidebarInset` y `TopNavigation`; cada `page.tsx` del grupo repite el guard porque Next.js conserva el layout durante navegaciones cliente. El layout raíz conserva su naturaleza de Server Component y delega el contexto de TanStack Query y el toaster global al Client Component `app/providers.tsx`.

Los guards consultan `GET /api/auth/check-status` mediante `lib/auth`, por lo que la presencia de `shopai_session` por sí sola no autoriza navegación. Una ausencia de cookie o cualquier fallo de validación se trata como sesión inválida. El layout y las páginas protegidas redirigen a `/login` y conservan la ruta interna solicitada; el layout de invitados redirige sesiones válidas a `/`. `getCurrentUser()` se memoiza durante cada render de servidor para evitar duplicar la consulta cuando layout y página validan juntos. `/privacy` y `/terms` permanecen fuera del guard de invitados.

`proxy.ts` no valida la sesión ni llama al backend. Sólo sobrescribe un header interno con el pathname y query de cada navegación de página para que los guards protegidos puedan construir `returnTo`; excluye APIs y recursos estáticos. La autorización efectiva se aplica en el servidor y debe repetirse cerca de cualquier acceso protegido a datos.

## Límites Server/Client

Los layouts y páginas son Server Components por defecto. Los layouts de sesión y las páginas protegidas son `async` porque usan las APIs asíncronas `cookies()`/`headers()` de Next 16 y validan la sesión en el servidor.

Los límites cliente aparecen donde existe interactividad o una primitiva que la necesita:

- `components/AppSidebar/AppSidebar.tsx` usa `usePathname()` para marcar navegación activa.
- `app/(auth)/_components/AuthForm.tsx` usa React Hook Form.
- Los formularios de `brands` y `categories` usan React Hook Form para validación, preview y mutaciones; sus listados delegan la interacción a Client Components pequeños.
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

### Administración de brands

`/admin/brands` obtiene las marcas desde el backend en su Server Component. Los parámetros `name` y `page` de la URL se traducen a `name`, `limit` y `offset` para que tanto la búsqueda como el paginado sean remotos. Como el backend devuelve un array sin total, el frontend solicita once elementos, muestra diez y usa el elemento adicional sólo para determinar si existe una página siguiente.

La interacción del listado vive en un Client Component de la feature: aplica debounce al buscador, conserva el filtro al cambiar de página y navega a las rutas de alta y edición. La eliminación usa una Server Action que vuelve a validar la sesión, llama a `DELETE /api/brands/{id}` con el JWT `HttpOnly` y revalida el listado. Los errores esperados se devuelven como datos mostrables en lugar de exponer detalles internos.

La presentación del listado se compone con `components/CrudTable/CrudTable.tsx`, que no conoce contratos de brands. Recibe filas, columnas y callbacks para buscar, paginar, crear, editar y eliminar; omitir la acción de creación oculta su botón.

`/admin/brands/new` y `/admin/brands/[id]/edit` son páginas servidor protegidas que reutilizan `BrandForm`. La edición obtiene la marca directamente del backend y convierte identificadores inválidos o ausentes en un 404. El formulario valida `name` y `slug` con Zod y React Hook Form, genera el slug durante el alta hasta que se edita manualmente y refleja los cambios en una preview. Las Server Actions de alta y edición vuelven a validar entrada y sesión, llaman a `POST /api/brands` o `PATCH /api/brands/{id}`, revalidan el listado y devuelven errores serializables. `logoUrl` no forma parte del formulario.

### Administración de categorías

`/admin/categories` replica el listado remoto paginado de brands con los parámetros `name`, `limit` y `offset`, y también solicita once registros para mostrar diez y detectar la página siguiente. Cada respuesta de la API se normaliza al entrar en la feature: `description` y `parentId`, opcionales en el contrato generado, se convierten a `null` cuando faltan. Así, los tipos internos y la validación del formulario no reciben `undefined`.

Para mostrar la jerarquía, el listado extrae sólo los IDs padre presentes en la página, elimina duplicados y consulta esos registros en paralelo. No recorre todo el catálogo en cada búsqueda o cambio de página. Las categorías raíz se identifican con una insignia y una referencia padre inexistente se presenta como desconocida.

`/admin/categories/new` y `/admin/categories/[id]/edit` son páginas servidor protegidas que reutilizan `CategoryForm`. El formulario separa la información general de la asignación de atributos, permite buscar y seleccionar los atributos activos y los guarda con la misma acción principal. Carga el catálogo completo para ofrecer las opciones jerárquicas y los atributos en lotes de cien; en edición también obtiene las asociaciones directas de la categoría. Se excluyen la propia categoría y todos sus descendientes como posibles padres para impedir ciclos.

Las Server Actions de alta y edición vuelven a validar entrada y sesión, limitan cada categoría a cincuenta atributos y comprueban que cada ID exista antes de guardar. Después guardan el CRUD de `/api/categories` y sincronizan las asociaciones mediante los endpoints anidados existentes, con un máximo de cinco solicitudes simultáneas. La edición calcula sólo altas y bajas, conserva las posiciones existentes y anexa nuevas asociaciones de forma determinística. Como la API no ofrece reemplazo transaccional, los resultados parciales se presentan de forma explícita y pueden reintentarse; si esto ocurre durante el alta, la interfaz continúa en la edición de la categoría ya creada. La eliminación conserva su acción independiente y todas las mutaciones revalidan las rutas afectadas.

### Administración de atributos

`/admin/attributes` replica el listado remoto paginado y buscable de los otros mantenimientos. Conserva `name` y `page` en la URL, solicita once registros para mostrar diez y representa el tipo y la unidad sin alterar el contrato recibido.

`/admin/attributes/new` y `/admin/attributes/[id]/edit` reutilizan `AttributeForm`. El alta exige elegir explícitamente entre texto, número y booleano; la edición muestra el tipo actual bloqueado y su Server Action nunca lo incluye en el `PATCH`. La unidad permanece opcional para cualquier tipo y se normaliza a `null` cuando queda vacía. Las mutaciones vuelven a validar sesión y datos, revalidan el listado y traducen conflictos de slug o dependencias a mensajes seguros.

### Administración de productos

`/admin/products` lista productos con paginado remoto y conserva en la URL la búsqueda por nombre y los filtros de marca y categoría. Los nombres se resuelven en el Server Component y la interacción reutiliza el área opcional `filters` de `CrudTable`.

`/admin/products/new` y `/admin/products/[id]/edit` mantienen la lectura inicial y el guard en servidor. `ProductForm` carga con TanStack Query la plantilla directa desde `GET /api/admin/categories/:id/attributes`, representa texto, número y booleanos ternarios y bloquea el guardado mientras la plantilla está cargando o en error. El alta exige además un precio inicial local entre cero y `9.999.999.999,99`, con dos decimales como máximo; este campo no forma parte de la edición general ni del contrato de producto.

Las Server Actions validan schema, sesión y el tipo de los atributos que pertenecen a la plantilla seleccionada. Los valores recibidos para atributos ajenos se ignoran como estado deseado: guardan primero el producto y luego, con un máximo conjunto de cinco solicitudes concurrentes, ejecutan como operaciones independientes la reconciliación de especificaciones y, sólo en el alta, `POST /api/products/:id/prices`. La moneda `USD` y `recordedAt` se fijan en el servidor. El flujo no es transaccional: un fallo de precio o especificaciones conserva el producto, devuelve `productSaved`/`productId`, combina la advertencia cuando corresponde y permite reintentar desde edición. Los valores vacíos de especificaciones también se eliminan.

La página de edición carga en paralelo y con `cache: "no-store"` el producto, las especificaciones, las opciones y el histórico completo de precios. El gestor de precios es un formulario separado del guardado general: muestra el registro más reciente como actual, conserva la moneda propia de registros anteriores y añade nuevas entradas exclusivamente en USD mediante una Server Action autenticada. Esa acción valida el importe, asigna la hora del servidor y revalida la edición. No existen operaciones de corrección, eliminación ni sobrescritura de precios, por lo que guardar datos generales o especificaciones nunca crea una entrada histórica.

### Formularios de acceso

`/login` y `/register` pasan un discriminante `mode` y un destino interno validado a `AuthShell` y `AuthForm`. `/forgot-password` es exclusiva de invitados; `/privacy` y `/terms` siguen siendo placeholders públicos. Estas rutas evitan enlaces rotos, pero no implementan flujos ni contenido legal definitivo. `AuthForm.tsx`:

1. crea el formulario con React Hook Form;
2. valida con `zodResolver(authFormSchema)`, una unión discriminada que sólo aplica la complejidad de contraseña al registro;
3. registra inputs de texto directamente y adapta `Checkbox` mediante `Controller`;
4. muestra errores con `FieldError` y atributos `aria-invalid`/`aria-describedby`.

El submit usa `useLogin` o `useRegister`. Registro transforma nombre y apellidos a `fullname`; términos y preferencia de recuerdo no se envían al backend. En éxito actualiza la query de sesión y navega a la ruta interna solicitada, o a `/` si no existe una segura. Los errores de validación, credenciales, conflicto y red se presentan de forma accesible.

## Áreas todavía no definidas

- autorización por roles y protección de operaciones de datos;
- modelo de datos del catálogo fuera de los contratos actuales de brands y categorías;
- estado global de aplicación fuera del server state administrado por TanStack Query;
- despliegue y variables de entorno;
- límites de dominio entre administración, catálogo y asistente.

El backend no expone refresh token ni revocación/logout. El logout del frontend sólo elimina la cookie local, y “Recuérdame” nunca extiende las dos horas de vigencia del JWT.
