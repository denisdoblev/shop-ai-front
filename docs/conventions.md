# Convenciones del código

Este documento separa reglas comprobadas de patrones incipientes, inconsistencias y propuestas. Las rutas citadas son la evidencia; una dependencia por sí sola no se considera prueba de uso.

## Convenciones establecidas

### Routing y layouts

- Se usa App Router en `app/`, con los nombres especiales de Next.js en minúsculas (`layout.tsx`, `page.tsx`). Evidencia: `app/layout.tsx`, `app/(auth)/login/page.tsx` y todas las rutas bajo `app/(authenticated)/`.
- Los route groups separan experiencias sin alterar la URL: `(auth)` para login, registro y páginas públicas relacionadas con el acceso; `(authenticated)` para la carcasa principal. Evidencia: sus respectivos `layout.tsx` y las rutas `forgot-password`, `privacy` y `terms`.
- El nombre `(authenticated)` no otorga seguridad. No se debe describir ni reutilizar como mecanismo de autorización hasta que exista una comprobación real.
- Las páginas y layouts se exportan por defecto. Evidencia: `app/(auth)/register/page.tsx`, `app/(auth)/layout.tsx` y todas las páginas placeholder de `app/(authenticated)/`.

### TypeScript e imports

- TypeScript se ejecuta con `strict: true`, `noEmit: true`, resolución `bundler` y soporte del plugin de Next. Fuente: `tsconfig.json`.
- El alias `@/*` apunta a la raíz. Se usa para cruzar áreas, por ejemplo desde layouts o features hacia `components/ui`. Evidencia: `app/(authenticated)/layout.tsx` y `app/(auth)/_components/AuthForm.tsx`.
- Dentro de la feature colocada junto a la ruta se usan imports relativos. Evidencia: `app/(auth)/login/page.tsx` importa `../_components/*`, y `AuthForm.tsx` importa `../_lib/*`, `../types/*` y `./*`.
- Los imports sólo de tipos usan `import type`. Evidencia: `app/layout.tsx`, `app/(auth)/types/Auth.ts` y los componentes de autenticación.
- Los tipos públicos observados usan alias `type`, no interfaces ni prefijos `I`. Evidencia: `app/(auth)/types/Auth.ts` y `SidebarContextProps` en `components/ui/sidebar.tsx`.

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
- La superficie de autenticación define una paleta `--auth-*` completa para temas claro y oscuro. Sus controles reutilizan los tokens semánticos globales del tema correspondiente, evitando mezclar superficies claras con controles oscuros.
- Los controles de formulario relacionan label, control y error con `htmlFor`, `id`, `aria-invalid` y `aria-describedby`. Evidencia: `TextField.tsx`, `PasswordField.tsx` y el checkbox de términos en `AuthForm.tsx`.

### Tooling

- pnpm es el gestor establecido y está fijado como `pnpm@11.22.0` en `package.json`.
- ESLint usa flat config con `eslint-config-next/core-web-vitals` y `eslint-config-next/typescript`. Fuente: `eslint.config.mjs`.
- No existe configuración de Prettier. No ejecutar formateo global ni asumir reglas que ESLint no impone.

## Patrón predominante o emergente

Estos patrones orientan cambios pequeños, pero la evidencia todavía no basta para convertirlos en una arquitectura universal.

### Colocación por feature

La feature de autenticación coloca UI privada en `_components`, lógica de validación en `_lib` y tipos en `types`, todo bajo `app/(auth)`. Es el ejemplo más completo disponible, pero es una sola feature. Puede reutilizarse para una feature estrictamente ligada a una ruta; no obliga a migrar los componentes compartidos de raíz ni define cómo organizar servicios futuros.

### Nombres

- Los componentes de producto y autenticación usan PascalCase tanto en símbolo como en archivo: `AuthForm.tsx`, `AuthShell.tsx`, `AppSidebar.tsx`, `TopNavigation.tsx`.
- Los componentes reutilizables usan predominantemente exports nombrados (`AuthForm`, `AuthShell`, `AppSidebar`, `TopNavigation`); `Logo.tsx` es la excepción con export default.
- Las primitivas instaladas por shadcn usan archivos kebab-case o minúsculos: `input-group.tsx`, `navigation-menu.tsx`, `button.tsx`.
- Los hooks compartidos usan prefijo `use` y archivo kebab-case: `hooks/use-mobile.ts` exporta `useIsMobile`.
- Los schemas y tipos de autenticación están en archivos PascalCase (`AuthFormSchema.ts`, `Auth.ts`), pero sólo existe un ejemplo de cada uno.

No renombrar archivos existentes para uniformarlos sin una decisión explícita.

### Formularios y validación

En autenticación, el patrón es React Hook Form + `zodResolver` + un schema Zod inferido para obtener el tipo del formulario. Los inputs nativos se registran con `register`; los controles con API propia, como Base UI `Checkbox`, usan `Controller`. Los campos reutilizables reciben `UseFormRegisterReturn` y el mensaje de error.

Evidencia: `app/(auth)/_components/AuthForm.tsx`, `app/(auth)/_lib/AuthFormSchema.ts` y `app/(auth)/types/Auth.ts`.

Este patrón todavía no cubre validación de servidor, errores HTTP, estados pendientes, reintentos ni mutaciones. No inventar esos contratos a partir del formulario actual.

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
| Directorio de tipos | `app/(auth)/types` no lleva `_`, a diferencia de `_components` y `_lib` | es seguro en App Router, pero no hay una convención uniforme sobre carpetas privadas |

## Dónde implementar

- **Nueva URL:** crear su segmento y `page.tsx` bajo el route group cuyo layout corresponda. Una pantalla pública no debe entrar en `(authenticated)` sólo por conveniencia visual.
- **UI exclusiva de una ruta o grupo:** colocarla junto a la feature; el precedente disponible es `_components` dentro de `(auth)`.
- **Componente de producto reutilizado por varias rutas:** usar `components/<Nombre>/<Nombre>.tsx`, siguiendo `AppSidebar` y `TopNavigation`.
- **Primitiva de diseño genérica:** revisar primero `components/ui/` y `components.json`. Si se incorpora una primitiva shadcn, se agrega como código fuente a `components/ui/`; no mezclarla con reglas de dominio.
- **Hook realmente compartido:** usar `hooks/`; hoy sólo existe `use-mobile.ts`.
- **Utilidad transversal:** usar `lib/` sólo cuando sea compartida; hoy contiene únicamente el reexport de `cn`.
- **Schema/tipos exclusivos de autenticación:** mantenerlos en `app/(auth)/_lib` y `app/(auth)/types`. Para otros dominios, este esquema es una referencia emergente, no una obligación.
- **Endpoint, cliente HTTP o acceso a datos:** no hay ubicación establecida. La primera implementación requiere decidir y documentar el límite antes de crear una jerarquía extensa.

## Patrones que no están establecidos

No hay evidencia de barrel files (`index.ts`), gestores de estado global, providers de datos, `fetch`, Axios, SWR, TanStack Query, Server Actions, route handlers, ORM, DTOs de red, middleware/proxy, manejo global de errores, internacionalización ni autenticación real. No introducirlos como si fueran convenciones existentes.

## Propuestas pendientes de decisión

Las siguientes ideas **no son reglas actuales**:

- adoptar un formatter y fijar punto y coma, comillas y orden de imports;
- definir una política única para nombres de archivos y carpetas privadas;
- convertir colores literales repetidos en tokens semánticos;
- fijar el idioma de producto o incorporar una estrategia de i18n;
- definir autenticación/autorización, capa HTTP y contratos de error;
- elegir estrategia y niveles de testing;
- excluir `.agents/` del lint o aceptar explícitamente sus warnings.

Cuando una decisión se implemente de forma consistente, moverla a “Convenciones establecidas” con nueva evidencia.
