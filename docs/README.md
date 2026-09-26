# Documentación de ShopAI Frontend

Esta documentación describe el estado real del código analizado. El proyecto está evolucionando; por eso las convenciones se clasifican según la fuerza de su evidencia y no según preferencias generales.

## Mapa de lectura

- [`architecture.md`](architecture.md): aplicaciones, rutas, layouts, límites Server/Client, responsabilidades y flujo de estado actual.
- [`conventions.md`](conventions.md): dónde implementar código, nombres, imports, componentes, formularios, estilos e inconsistencias conocidas.
- [`development.md`](development.md): instalación, ejecución, build, validaciones, testing y configuración.
- [`../AGENTS.md`](../AGENTS.md): instrucciones operativas breves para futuras sesiones de agentes.

Para implementar una feature nueva, leé primero `architecture.md` y `conventions.md`; después consultá la sección de validación de `development.md`. Si la feature usa una API de Next.js, también es obligatorio leer la guía correspondiente incluida en `node_modules/next/dist/docs/`, como indica `AGENTS.md`.

## Cómo interpretar las convenciones

Los documentos usan estas categorías:

1. **Convención establecida:** aparece de forma consistente, está respaldada por configuración o por una convención del framework ya adoptada y debe respetarse.
2. **Patrón predominante:** es el enfoque más visible, pero la evidencia es limitada o existen excepciones.
3. **Inconsistencia:** conviven enfoques diferentes y el repositorio no define cuál es el correcto.
4. **Propuesta:** mejora posible que aún no forma parte de las reglas del proyecto.

Las propuestas se documentan sólo para evitar que un agente las presente como decisiones ya tomadas.

## Estado funcional resumido

- La estructura de navegación principal y administrativa está definida en `components/AppSidebar/AppSidebar.tsx`.
- `/login` y `/register` tienen una interfaz compartida, validación en cliente e integración real con el backend bajo `app/(auth)/`.
- `/`, `/explore`, `/compare` y `/assistant` usan catálogo real dentro de la carcasa con sidebar; Home y Explore enlazan cada card a un asistente enfocado por `productId`, que conserva un historial visual sólo durante la visita y envía cada pregunta independiente al BFF `/api/ai/chat`. `/saved` y `/history` siguen como placeholders. La administración de brands, categorías, atributos y productos está integrada con el backend; el overview y las plantillas administrativas siguen pendientes.
- La autenticación usa Route Handlers same-origin, TanStack Query y una cookie JWT `HttpOnly`; el layout de invitados y tanto el layout como cada página protegida validan esa sesión contra el backend.
- La capa HTTP tipada soporta consumo server/client y sus contratos se generan desde OpenAPI.
- Existe una suite Vitest para HTTP, autenticación, BFF, loaders, providers, páginas y formularios.

No hay evidencia suficiente para crear ADRs ni guías separadas de backend o acceso a datos.
