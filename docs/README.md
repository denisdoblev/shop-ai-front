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
- `/login` y `/register` tienen una interfaz compartida y validación en cliente bajo `app/(auth)/`.
- `/`, `/explore`, `/compare`, `/assistant`, `/saved`, `/history` y las rutas `/admin/*` usan la carcasa con sidebar, pero casi todas siguen siendo placeholders.
- No existen endpoints, acceso a datos, autenticación efectiva, autorización, Server Actions ni variables de entorno usadas por la aplicación.
- No existe suite de tests automatizados.

No hay evidencia suficiente para crear ADRs ni guías separadas de backend o acceso a datos.
