# Arquitectura

## Alcance y madurez

El repositorio contiene una sola aplicación frontend, no un monorepo de aplicaciones o paquetes. `pnpm-workspace.yaml` configura builds permitidos de pnpm, pero no declara `packages`; `package.json` es el único manifiesto del proyecto.

La aplicación usa Next.js 16.3.4, React 19.2.8 y App Router. Hay layouts, navegación, tema, componentes compartidos y autenticación integrada con el backend. Home, Explore, comparación y la administración del catálogo consumen datos reales; otras áreas conservan estados parciales o placeholders.

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
    ├── page.tsx                  # /, home de descubrimiento basada en catálogo
    ├── _components/              # UI compartida por las rutas protegidas
    ├── _lib/                     # loaders y parsers de descubrimiento
    ├── _providers/               # selección global de comparación
    ├── _types/                   # modelos serializables de home
    ├── assistant/page.tsx        # /assistant
    ├── compare/page.tsx          # /compare
    ├── explore/page.tsx          # /explore
    ├── history/page.tsx          # /history
    ├── saved/page.tsx            # /saved
    └── admin/                    # /admin y mantenimiento de catálogo
        ├── brands/               # listado, /new y /[id]/edit
        ├── categories/           # listado jerárquico, /new, /[id]/edit y acciones
        ├── attributes/           # listado, /new, /[id]/edit y acciones tipadas
        ├── products/             # listado filtrable, /new, /[id]/edit, precios y especificaciones
        └── templates/page.tsx    # /admin/templates (placeholder)
components/
├── AppSidebar/                   # navegación lateral de producto
├── CrudTable/                    # tabla CRUD genérica con búsqueda, acciones y paginación
│   └── _types/types.ts           # contratos tipados internos de la tabla
├── TopNavigation/                # barra superior de producto
└── ui/                           # primitivas shadcn instaladas como código fuente
hooks/                            # hooks compartidos de responsive y sesión
lib/utils.ts                      # reexport de cn
lib/http/                         # fetch tipado y clientes server/client
lib/api/generated.ts             # contrato generado desde OpenAPI
lib/auth/                         # services de auth, sesión y helpers BFF
lib/query/                        # QueryClient y query keys
app/api/auth/                     # BFF de login, registro, sesión y logout
app/api/admin/categories/[id]/attributes/ # BFF autenticado de plantillas
app/api/favorites/[productId]/    # BFF autenticado para mutar favoritos
public/                           # assets estáticos, incluido el hero del catálogo
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
    ├── /                                      # home de catálogo; vuelve a validar la sesión
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
- Los formularios de `brands`, `categories`, `attributes` y `products` usan React Hook Form para validación, preview y mutaciones; sus listados delegan la interacción a Client Components pequeños.
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
| `hooks` | hooks compartidos | `hooks/use-mobile.ts`, `hooks/use-session.ts` |
| `lib/http`, `lib/api`, `lib/auth`, `lib/query` | HTTP compartido, contrato OpenAPI, sesión y server state | `lib/http/request.ts`, `lib/api/generated.ts` |

`lib/http/request.ts` implementa la base sobre `fetch`; `lib/http/server.ts` resuelve la URL privada del backend y `lib/http/client.ts` consume URLs relativas same-origin. `lib/api/generated.ts` se genera desde Swagger y no se edita manualmente. `AuthFormSchema.ts` sigue siendo validación de interfaz, no un DTO mantenido a mano.

## Flujo HTTP y sesión

```text
Server Component ── lib/http/server ──────────────> backend
Client Component ── TanStack Query/BFF ──> /api/auth/*, /api/favorites/*, /api/admin/* ──> backend
                                                 │
                                                 └── cookie shopai_session HttpOnly
```

El backend devuelve un JWT Bearer en el body y no habilita CORS. Por eso el navegador no lo llama directamente: los Route Handlers de autenticación guardan el token en una cookie `HttpOnly`, devuelven sólo el perfil seguro y trasladan los errores HTTP sin revelar secretos. El Proxy no actúa como proxy HTTP ni maneja el JWT. El helper `authenticatedServerRequest` añade el Bearer desde la cookie sólo en código servidor y mantiene esa dependencia separada del cliente HTTP general.

Las peticiones de autenticación usan `cache: "no-store"`. La capa servidor acepta las opciones de caché y revalidación de Next para que futuros recursos públicos decidan su política por operación.

## Flujos implementados

### Home de catálogo

`/` es la entrada de descubrimiento del catálogo dentro de la carcasa autenticada. Después de repetir el guard de sesión, renderiza inmediatamente el hero y transmite de forma independiente las primeras seis categorías y los primeros tres productos detrás de límites `Suspense` con `Skeleton`. Cada producto se enriquece en paralelo con su primera imagen y el registro de precio más reciente; los fallos de imagen o precio conservan el producto con esos datos ausentes, mientras que un fallo del listado se aísla dentro de su sección. Las cards destacadas muestran esos datos ya serializables y consumen la selección global de comparación.

La página y la carga de sus secciones permanecen como Server Components. `FeaturedProductsGrid` es el límite cliente pequeño que recibe sólo los productos enriquecidos; `RemoteProductImage` intenta mostrar la URL remota del catálogo y cambia al asset local cuando la URL falta o la carga falla. Las categorías usan `categoryId` en `/explore` y la comparación usa parámetros `productId` repetidos, en el orden elegido, por ejemplo `/compare?productId=<id-1>&productId=<id-2>`. El parser acepta valores escalares o repetidos, conserva UUID válidos, elimina duplicados y limita el resultado a cuatro.

`CompareProvider` vive dentro del layout autenticado y guarda `{ id, name }[]` por `userId` en una clave versionada de `localStorage`. Datos corruptos o storage bloqueado degradan a una selección vacía o sólo en memoria. Home y Explore comparten las acciones `add`, `remove`, `toggle`, `replace` y `clear`. El dock global aparece únicamente en `/` y `/explore`; muestra iniciales removibles, contador, limpieza y el enlace canónico a `/compare`.

### Explore real y favoritos

`/explore` es un Server Component protegido. Normaliza búsqueda, categorías, bandas USD, características booleanas, orden y paginación desde la URL. Luego inicia en paralelo la búsqueda agregada y los favoritos del usuario. La búsqueda fallida tiene un estado propio; un fallo de favoritos conserva el catálogo, muestra una advertencia y deshabilita los corazones. El catálogo vacío y la ausencia de coincidencias también se distinguen.

Los filtros se muestran en un sidebar de escritorio y en `Sheet` móvil. Cualquier formulario de filtros omite `offset`, por lo que vuelve a la primera página. Las cards usan el producto enriquecido de `/api/products/search`; el corazón es optimista y llama al BFF same-origin `app/api/favorites/[productId]`, mientras Comparar consume el provider global. El JWT `HttpOnly` nunca llega al cliente.

`/compare` sigue siendo un Server Component y delega su acceso a datos en un loader privado de la feature. Consulta los productos seleccionados en paralelo y conserva el orden de la URL; después enriquece cada resultado con marca, categoría, primera imagen, precio más reciente y especificaciones. Las consultas auxiliares independientes usan `Promise.allSettled`, y las marcas, categorías y atributos compartidos se deduplican antes de consultarse. Un producto inaccesible se omite y produce una comparación parcial; el fallo de un recurso auxiliar conserva el producto y muestra “No informado” en los valores afectados.

El loader unifica los atributos presentes, aplica primero la posición configurada en cada categoría y formatea moneda, números con unidad y booleanos antes de entregar un modelo serializable a la tabla. La tabla mantiene semántica de encabezados, scroll horizontal y primera columna fija. Al entrar directamente, los productos válidos reemplazan la selección del provider. Quitar una opción actualiza simultáneamente provider y URL; agregar vuelve a `/explore`. Debajo se muestra, sólo con al menos dos productos recuperados, un veredicto de IA estático y explícitamente marcado como vista previa; no calcula recomendaciones, ganadores, ratings ni ajustes personalizados hasta que exista soporte real del backend.

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

- presentación y restricción de rutas administrativas según los roles del usuario; las mutaciones administrativas de catálogo ya dependen de la autorización `ADMIN` aplicada por el backend;
- experiencia persistente del asistente, historial de conversaciones y pantalla de productos guardados;
- destino de despliegue y gestión de variables de entorno de producción; en desarrollo sólo se define `BACKEND_URL`;
- límites de dominio de largo plazo entre administración, descubrimiento, comparación y asistente;
- una solución general de estado cliente: hoy sólo existe el contexto específico de comparación, persistido por usuario en `localStorage`.

El backend no expone refresh token ni revocación/logout. El logout del frontend sólo elimina la cookie local, y “Recuérdame” nunca extiende las dos horas de vigencia del JWT.
