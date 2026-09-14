# Convenciones del código

Este documento separa reglas comprobadas de patrones incipientes, inconsistencias y propuestas. Las rutas citadas son la evidencia; una dependencia por sí sola no se considera prueba de uso.

## Convenciones establecidas

### Sincronizaciones no transaccionales

Las relaciones anidadas sin endpoint de reemplazo —asignaciones de categoría y especificaciones de producto— se reconcilian después de guardar el recurso principal, con concurrencia máxima de cinco solicitudes. En productos, la plantilla seleccionada define el estado deseado: los atributos ajenos se ignoran como entrada y cualquier especificación previa asociada a ellos se elimina. Las acciones devuelven explícitamente el guardado parcial y, en altas, el identificador creado para continuar en edición; no se simula atomicidad que el backend no ofrece.

### Routing y layouts

- Se usa App Router en `app/`, con los nombres especiales de Next.js en minúsculas (`layout.tsx`, `page.tsx`). Evidencia: `app/layout.tsx`, `app/(auth)/(guest)/login/page.tsx` y todas las rutas bajo `app/(authenticated)/`.
- Los route groups separan experiencias sin alterar la URL: `(auth)` para la superficie pública, su grupo `(guest)` para login, registro y recuperación exclusivos de invitados, y `(authenticated)` para la carcasa protegida. Evidencia: sus respectivos layouts y las rutas `privacy` y `terms` fuera de `(guest)`.
- Las carpetas internas colocadas junto a una feature llevan prefijo `_`, como `_components`, `_hooks`, `_lib` y `_types`. En `app/`, este prefijo también las excluye explícitamente del sistema de rutas de Next.js; se conserva la misma señal en componentes compartidos cuando la carpeta no forma parte de su API pública.
- El layout `(guest)`, el layout `(authenticated)` y cada página protegida validan `shopai_session` contra `GET /api/auth/check-status`; las páginas repiten el guard porque los layouts persisten durante navegaciones cliente. `getCurrentUser()` memoiza el resultado dentro de un render de servidor para evitar consultas duplicadas. No se considera autenticado a quien sólo presenta una cookie y `proxy.ts` nunca sustituye la comprobación segura.
- Las páginas y layouts se exportan por defecto. Evidencia: `app/(auth)/(guest)/register/page.tsx`, `app/(auth)/layout.tsx` y todas las páginas placeholder de `app/(authenticated)/`.

### TypeScript e imports

- TypeScript se ejecuta con `strict: true`, `noEmit: true`, resolución `bundler` y soporte del plugin de Next. Fuente: `tsconfig.json`.
- El alias `@/*` apunta a la raíz. Se usa para cruzar áreas, por ejemplo desde layouts o features hacia `components/ui`. Evidencia: `app/(authenticated)/layout.tsx` y `app/(auth)/_components/AuthForm.tsx`.
- Dentro de la feature colocada junto a la ruta se usan imports relativos. Evidencia: `app/(auth)/(guest)/login/page.tsx` importa `../../_components/*`, y `AuthForm.tsx` importa `../_lib/*`, `../_types/*` y `./*`.
- Los imports sólo de tipos usan `import type`. Evidencia: `app/layout.tsx`, `app/(auth)/_types/Auth.ts` y los componentes de autenticación.
- Los tipos públicos observados usan alias `type`, no interfaces ni prefijos `I`. Evidencia: `app/(auth)/_types/Auth.ts` y `SidebarContextProps` en `components/ui/sidebar.tsx`.

### Server y Client Components

- El componente es de servidor por defecto. Se agrega `"use client"` sólo si usa estado, efectos, navegación reactiva, handlers o primitivas cliente. Evidencia: `app/(authenticated)/layout.tsx` frente a `components/AppSidebar/AppSidebar.tsx`; `AuthShell.tsx` frente a `PasswordField.tsx`.
- Los Client Components observados no son funciones `async`; el acceso servidor a cookies queda en el layout async. Evidencia: `app/(authenticated)/layout.tsx` y los archivos con directiva cliente.
- Para APIs de Next.js se debe consultar la documentación de la versión instalada en `node_modules/next/dist/docs/`; Next 16 usa, por ejemplo, `await cookies()` y los helpers globales `LayoutProps`.

### UI y estilos

- Las primitivas reutilizables viven en `components/ui/` y se consumen desde el código de producto en lugar de duplicar controles. Evidencia: `AuthForm.tsx` compone `Button`, `Checkbox`, `Field` y `Alert`; `TopNavigation.tsx` compone `Button` y `SidebarTrigger`.
- shadcn está configurado con estilo `base-nova`, primitivas Base UI, React Server Components, TypeScript, iconos Lucide y aliases `@/components`, `@/components/ui`, `@/hooks` y `@/lib`. Fuente: `components.json`.
- Tailwind CSS 4 se carga en `app/globals.css` mediante `@import "tailwindcss"`; no existe `tailwind.config.*`. Los tokens se exponen con `@theme inline` y variables CSS.
- Las fuentes se cargan con `next/font` en `app/layout.tsx` y se mapean a `font-sans`, `font-body`, `font-heading`, `font-label` y `font-mono` en `app/globals.css`.
- Los estilos globales, tokens de marca y tokens propios de autenticación se centralizan en `app/globals.css`. Al extender el tema, ése es el archivo canónico indicado también por `components.json`.
- El violeta `#5b5bd6` es el primary de producto. Los estados positivos reutilizan los tokens semánticos `success`/`success-foreground` y la variante `success` de Badge, sin colores Tailwind literales en los consumidores.
- La superficie de autenticación define una paleta `--auth-*` completa para temas claro y oscuro. Sus controles reutilizan los tokens semánticos globales del tema correspondiente, evitando mezclar superficies claras con controles oscuros.
- Los controles de formulario relacionan label, control y error con `htmlFor`, `id`, `aria-invalid` y `aria-describedby`. Evidencia: `TextField.tsx`, `PasswordField.tsx` y el checkbox de términos en `AuthForm.tsx`.

### Tooling

- pnpm es el gestor establecido y está fijado como `pnpm@11.22.0` en `package.json`.
- ESLint usa flat config con `eslint-config-next/core-web-vitals` y `eslint-config-next/typescript`. Fuente: `eslint.config.mjs`.
- No existe configuración de Prettier. No ejecutar formateo global ni asumir reglas que ESLint no impone.

### HTTP, contratos y server state

- Toda serialización, parseo y normalización de errores HTTP reutiliza `lib/http/request.ts`; no agregar Axios ni clientes paralelos.
- Código servidor obtiene el backend mediante `lib/http/server.ts` y la variable privada `BACKEND_URL`. Código cliente usa `lib/http/client.ts` contra rutas same-origin.
- `lib/api/generated.ts` se genera con `pnpm api:types` desde OpenAPI y no se edita manualmente.
- El JWT vive exclusivamente en la cookie `shopai_session` `HttpOnly`. Sólo `lib/auth` y los Route Handlers manejan su valor.
- Los destinos posteriores al acceso deben pasar por la utilidad compartida de `lib/auth`: sólo se aceptan rutas internas que no vuelvan a `/login`, `/register` o `/forgot-password`.
- Los Server Components llaman al backend directamente. Los Route Handlers se reservan para el límite BFF que necesita transformar la sesión o atender al navegador.
- TanStack Query se expone mediante `app/providers.tsx`; query keys estables viven en `lib/query/keys.ts` y los hooks de feature encapsulan queries o mutations.
- La política de caché se decide por request. Autenticación usa `no-store`; no imponerlo globalmente a futuros recursos.
- Los listados administrativos interactivos mantienen filtros y página en la URL. El Server Component traduce esos valores a parámetros del backend y entrega datos serializables a un límite cliente pequeño.
- Las mutaciones internas iniciadas por componentes cliente usan Server Actions colocadas junto a la feature. Cada acción vuelve a validar la sesión y reutiliza `authenticatedServerRequest`; los fallos esperados se modelan como resultados discriminados.

### Tablas CRUD reutilizables

`components/CrudTable/CrudTable.tsx` es la composición compartida para listados administrativos. Sus columnas, textos de contenido y mensajes de interfaz son configurables y las decisiones de dominio quedan en un Client Component de la feature. Los mensajes mantienen defaults en inglés para compatibilidad y cada consumidor puede reemplazarlos parcialmente. `createAction` es opcional y su ausencia oculta el botón; edición y eliminación se conectan mediante callbacks tipados. La búsqueda y el paginado son controlados para que cada feature pueda respaldarlos con URL y servidor, sin filtrar silenciosamente sólo la página visible. Sus contratos se declaran en `components/CrudTable/_types/types.ts`, para separar la API tipada reutilizable de la implementación interactiva; los consumidores importan esos tipos desde ese módulo.

Las acciones por fila se representan con botones de icono etiquetados, Tooltip y confirmación mediante AlertDialog. Los estados sin datos usan Empty y los errores esperados usan Alert. Las primitivas visuales continúan viviendo en `components/ui/` y no incorporan reglas de dominio.

## Patrón predominante o emergente

Estos patrones orientan cambios pequeños, pero la evidencia todavía no basta para convertirlos en una arquitectura universal.

### Colocación por feature

La feature de autenticación coloca UI privada en `_components`, lógica de validación en `_lib` y tipos en `_types`, todo bajo `app/(auth)`. Es el ejemplo más completo disponible, pero es una sola feature. Puede reutilizarse para una feature estrictamente ligada a una ruta; no obliga a migrar los componentes compartidos de raíz ni define cómo organizar servicios futuros.

### Nombres

- Los componentes de producto y autenticación usan PascalCase tanto en símbolo como en archivo: `AuthForm.tsx`, `AuthShell.tsx`, `AppSidebar.tsx`, `TopNavigation.tsx`.
- Los componentes reutilizables usan predominantemente exports nombrados (`AuthForm`, `AuthShell`, `AppSidebar`, `TopNavigation`); `Logo.tsx` es la excepción con export default.
- Las primitivas instaladas por shadcn usan archivos kebab-case o minúsculos: `input-group.tsx`, `navigation-menu.tsx`, `button.tsx`.
- Los hooks compartidos usan prefijo `use` y archivo kebab-case: `hooks/use-mobile.ts` exporta `useIsMobile`.
- Los schemas y tipos de autenticación están en archivos PascalCase (`AuthFormSchema.ts`, `Auth.ts`), pero sólo existe un ejemplo de cada uno.

No renombrar archivos existentes para uniformarlos sin una decisión explícita.

### Formularios y validación

En autenticación, el patrón es React Hook Form + `zodResolver` + una unión discriminada de schemas Zod inferida para obtener el tipo del formulario. Login sólo exige que exista una contraseña; registro aplica las reglas de complejidad, nombres y aceptación de términos. Los inputs nativos se registran con `register`; los controles con API propia, como Base UI `Checkbox`, usan `Controller`. Los campos reutilizables reciben `UseFormRegisterReturn` y el mensaje de error.

Evidencia: `app/(auth)/_components/AuthForm.tsx`, `app/(auth)/_lib/AuthFormSchema.ts` y `app/(auth)/_types/Auth.ts`.

Los formularios de autenticación usan hooks de mutación de TanStack Query, deshabilitan el submit mientras está pendiente y traducen errores remotos a errores de campo o formulario. Los schemas Zod validan la interfaz; los DTOs TypeScript provienen de OpenAPI.

Los formularios administrativos de brands, categorías y atributos conservan React Hook Form y Zod en el límite cliente, vuelven a validar el mismo schema dentro de sus Server Actions y usan `useTransition` para el estado pendiente. Las respuestas esperadas de la acción separan errores por campo del mensaje general; los éxitos usan el toaster global y vuelven al listado. Los conjuntos breves de opciones usan `ToggleGroup`; en atributos, el tipo se elige al crear y queda bloqueado durante la edición.

### Imports

En los archivos más recientes de autenticación se agrupan dependencias externas, imports absolutos internos y luego imports relativos, separados por líneas en blanco. `AppSidebar.tsx` y varios componentes shadcn no siguen exactamente ese orden. Se puede conservar el estilo local del archivo; todavía no hay una regla automática de ordenamiento.

## Inconsistencias conocidas

| Tema | Evidencia | Consecuencia práctica |
| --- | --- | --- |
| Punto y coma | autenticación y layouts recientes los usan; `components/ui/*`, `AppSidebar.tsx`, `TopNavigation.tsx` y `use-mobile.ts` suelen omitirlos | conservar el estilo del archivo tocado; no reformatear en masa |
| Export default de componentes | páginas/layouts lo requieren y `Logo.tsx` también lo usa; los demás componentes de producto son exports nombrados | no inferir una prohibición absoluta; preferir export nombrado para nuevos componentes reutilizables hasta que se decida |
| Imports de `cn` | las primitivas importan desde el paquete `cn`; `lib/utils.ts` reexporta `cn`, pero actualmente no tiene consumidores | no asumir que `@/lib/utils` es el único camino establecido |
| Colores | existen tokens semánticos en `globals.css`, pero `AuthShell.tsx` y `PasswordField.tsx` contienen varios colores y sombras literales | reutilizar tokens cuando existan; no hacer una limpieza global sin alcance explícito |
| Idioma visible | metadata y autenticación están en español; sidebar y páginas placeholder están en inglés | no hay política de localización definida; mantener coherencia con la pantalla modificada |
| Estado de páginas | autenticación tiene componentes y validación; las rutas principales y administrativas son mayormente placeholders | no usar los placeholders como ejemplo de arquitectura de feature completa |

## Dónde implementar

- **Nueva URL:** crear su segmento y `page.tsx` bajo el route group cuyo layout corresponda. Una pantalla pública no debe entrar en `(authenticated)` sólo por conveniencia visual.
- **UI exclusiva de una ruta o grupo:** colocarla junto a la feature; el precedente disponible es `_components` dentro de `(auth)`.
- **Componente de producto reutilizado por varias rutas:** usar `components/<Nombre>/<Nombre>.tsx`, siguiendo `AppSidebar` y `TopNavigation`.
- **Primitiva de diseño genérica:** revisar primero `components/ui/` y `components.json`. Si se incorpora una primitiva shadcn, se agrega como código fuente a `components/ui/`; no mezclarla con reglas de dominio.
- **Hook realmente compartido:** usar `hooks/`; hoy sólo existe `use-mobile.ts`.
- **Utilidad transversal:** usar `lib/` sólo cuando sea compartida; hoy contiene únicamente el reexport de `cn`.
- **Schema/tipos exclusivos de autenticación:** mantenerlos en `app/(auth)/_lib` y `app/(auth)/_types`. Para otros dominios, este esquema es una referencia emergente, no una obligación.
- **Endpoint o acceso a datos:** reutilizar `lib/http`; colocar contratos generados en `lib/api`, concerns de sesión en `lib/auth` y Route Handlers explícitos bajo `app/api` sólo cuando el navegador necesite el BFF.

## Patrones que no están establecidos

No hay evidencia de barrel files (`index.ts`), gestores de estado global general, ORM ni internacionalización. El Proxy existente tiene el único alcance de propagar la URL solicitada; no ampliarlo a un proxy HTTP genérico.

## Propuestas pendientes de decisión

Las siguientes ideas **no son reglas actuales**:

- adoptar un formatter y fijar punto y coma, comillas y orden de imports;
- convertir colores literales repetidos en tokens semánticos;
- fijar el idioma de producto o incorporar una estrategia de i18n;
- definir autorización por roles en la interfaz;
- excluir `.agents/` del lint o aceptar explícitamente sus warnings.

Cuando una decisión se implemente de forma consistente, moverla a “Convenciones establecidas” con nueva evidencia.
