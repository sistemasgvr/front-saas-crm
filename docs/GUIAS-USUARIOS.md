# Recorridos de usuarios

La Guía del sistema (`/ayuda`) contiene 24 recorridos y 181 pasos explicativos.
Driver.js se carga al iniciar un recorrido. No se inicia automáticamente ni se
ejecutan envíos, llamadas, guardados, asignaciones o conexiones como parte de una guía.

## Flujos evaluados y cobertura

| Área | Recorridos | Requisitos |
| --- | --- | --- |
| Primeros pasos | Navegación, permisos, cabecera y acceso a guías | Usuario autenticado |
| Leads | Buscar/filtrar, responsable, contacto libre, reasignación, origen | Módulo LEADS; acciones de administración solo para administradores |
| Detalle del lead | Clasificación, etapas, validaciones, cierres, reapertura, visitas e historial | Abrir un lead; explicaciones según módulos y rol |
| Tablero | Tipos, búsqueda, columnas configuradas, arrastre, validación y etapas anteriores | Módulo LEADS |
| Agenda | Fechas, vistas, creación, responsables, visitas, resultados y siguiente acción | Módulo LEADS |
| Bandeja de chats | Visibilidad, búsqueda, pendientes, borradores, responsable y paginación | Módulo WHATSAPP |
| Atención de un chat | Toma humana, transferencia del chat y lead, bot, historial y bloqueo | Abrir un chat; los permisos reales no se cambian |
| Mensajería | Ventana de WhatsApp, texto, archivos, voz, contenido, estados y llamadas | Abrir un chat |
| Llamadas | Historial, filtros, resultados, duración y enlaces | Módulo WHATSAPP |
| Inmuebles | Catálogo y ficha de propiedad; alta y edición por separado | Módulo INMUEBLES; alta/edición para administradores |
| Dashboard | Filtros, contexto de indicadores y decisiones comerciales | Administrador + DASHBOARD |
| Configuración | Empresa, usuarios, pipeline, valores por defecto, reparto/cupos y conexiones | Administrador; pasos filtrados por módulos |
| Usuarios | Alta, roles, cupo, desactivación, cartera pendiente y reactivación | Administrador |
| Meta | Conexión, páginas, detalle de página, cuentas y detalle de cuenta | Administrador + META_LEADS |
| WhatsApp | Número, conexión, plantillas, variables y disponibilidad | Administrador + WHATSAPP |
| Perfil | Datos, avisos, contraseña y tema | Usuario autenticado |
| Notificaciones | Campana, avisos, lectura y permisos del navegador | Usuario autenticado |

## Comportamiento

- Acceso permanente desde el sidebar y acceso contextual desde el botón de ayuda
  de la cabecera, disponible también en móvil.
- Una invitación a conocer la guía aparece en la primera visita de este usuario y
  empresa en el navegador. Se puede descartar sin empezar ningún recorrido.
- Botones, progreso y explicaciones en español. Se respeta la preferencia de
  movimiento reducido y se ofrecen estilos claros y oscuros.
- Cada recorrido tiene pasos Anterior/Siguiente, salida por X/Escape, reanudación
  y repetición desde el inicio. Completar un recorrido no impide repetirlo.
- El progreso está en localStorage, versionado y separado por usuario/empresa.
  No se envía al backend ni se sincroniza entre dispositivos. Si el navegador no
  permite almacenamiento, la guía sigue funcionando sin persistencia.
- Iniciar una guía de módulo navega a su pantalla y espera su ancla de contenido.
  Cancelar la preparación evita que empiece después. Cambiar de ruta pausa la guía.
- Al iniciar un recorrido de detalle, se conserva la intención y se muestra un
  aviso para elegir el registro en su listado. Al abrirlo, la guía empieza
  automáticamente cuando termina de cargar. La ficha rápida de un lead continúa
  hacia su ficha completa para este recorrido. Se puede cancelar la selección;
  salir del módulo también la descarta. Nunca se elige un contacto automáticamente.
- Controles ausentes por permisos, falta de datos o diseño móvil se explican en
  un panel centrado. No se oculta silenciosamente la explicación.
- En Configuración solo se despliegan las secciones necesarias; al salir se
  restauran las que estaban cerradas. No se modifica su contenido.
- Las anclas `data-tour`, `data-tour-nav` y `data-tour-section` no cambian las
  reglas, consultas ni acciones comerciales de los componentes existentes.

## Mantenimiento y validación

El catálogo vive en `src/modules/guides/catalog.ts`. Cambios de flujos deben
actualizar sus explicaciones y, si corresponde, la versión de almacenamiento en
`progress.ts`. No insertar contenido de usuarios o HTML externo en los popovers.

`npm run test:guides` comprueba permisos/módulos, rutas contextuales, identificadores,
pantallas de entrada, anclas y persistencia. Complementar con TypeScript y ESLint.
La revisión visual autenticada debe cubrir un administrador y un agente, móvil y
escritorio, salida/reanudación, repetición, modo oscuro y pantallas sin registros.

Referencia de integración: [configuración oficial de Driver.js](https://driverjs.com/docs/configuration).
