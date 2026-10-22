import type { MeResponse } from "@/src/lib/auth";

export type GuideStep = {
  title: string;
  description: string;
  target?: string;
  section?: string;
  module?: string;
  admin?: boolean;
};
export type Guide = {
  id: string;
  title: string;
  description: string;
  category: string;
  icon: string;
  path: string;
  match?: string;
  ready: string;
  module?: string;
  admin?: boolean;
  steps: GuideStep[];
};

const step = (
  title: string,
  description: string,
  target?: string,
): GuideStep => ({ title, description, target });
const section = (title: string, description: string): GuideStep => ({
  ...step(title, description, `[data-tour-section="${title}"]`),
  section: title,
});

/** Cada recorrido corresponde a un flujo real. No hace clic en acciones de negocio. */
export const guides: Guide[] = [
  {
    id: "bienvenida",
    title: "Primeros pasos en el CRM",
    category: "Para empezar",
    icon: "mdi:compass-outline",
    description:
      "Ubícate en el sistema, conoce tus permisos y descubre cómo organizar tu jornada.",
    path: "/ayuda",
    ready: '[data-tour="guide-center"]',
    steps: [
      step(
        "Bienvenido a tu espacio de trabajo",
        "Aquí organizas contactos, conversaciones y seguimientos. Puedes salir con la X o Escape y repetir cualquier recorrido desde la Guía del sistema. Los botones del sistema quedan protegidos durante la explicación.",
      ),
      step(
        "Tu menú de trabajo",
        "El menú muestra los módulos habilitados para tu empresa y tu rol. En móvil, el botón de menú de la cabecera abre la navegación; en pantallas grandes puedes contraerla.",
        '[data-tour="sidebar"]',
      ),
      {
        ...step(
          "Leads: tu cartera de contactos",
          "Consulta interesados, revisa quién los atiende y sigue su avance comercial. La lista y el tablero comparten el mismo pipeline.",
          '[data-tour-nav="/leads"]',
        ),
        module: "LEADS",
      },
      {
        ...step(
          "Agenda: qué debes hacer y cuándo",
          "Organiza llamadas, reuniones, seguimientos y visitas. Revisa pendientes al comenzar tu jornada y registra el resultado después de atenderlos.",
          '[data-tour-nav="/agenda"]',
        ),
        module: "LEADS",
      },
      {
        ...step(
          "Chats y llamadas",
          "Atiende WhatsApp desde el CRM. El responsable de atención y el propietario del lead deben revisarse antes de responder o transferir.",
          '[data-tour-nav="/chats"]',
        ),
        module: "WHATSAPP",
      },
      {
        ...step(
          "Catálogo de inmuebles",
          "Consulta propiedades, disponibilidad y datos comerciales para vincularlas al interés de un lead o a sus visitas.",
          '[data-tour-nav="/inmuebles"]',
        ),
        module: "INMUEBLES",
      },
      {
        ...step(
          "Configuración de la empresa",
          "Propietarios y administradores gestionan usuarios, pipeline, reparto de leads y conexiones. Un agente recibe únicamente los accesos correspondientes a su rol.",
          '[data-tour-nav="/settings"]',
        ),
        admin: true,
      },
      step(
        "Cabecera y avisos",
        "Aquí encontrarás la empresa actual, el cambio de tema, las notificaciones y tu cuenta. El botón de ayuda permite recorrer la pantalla en la que estás.",
        '[data-tour="app-header"]',
      ),
      step(
        "Una guía para cada tarea",
        "Elige un tema y avanza a tu ritmo. Los recorridos de un lead, chat o inmueble se inician con un registro abierto: no elegimos contactos por ti.",
        '[data-tour="guide-center"]',
      ),
      step(
        "Tu progreso",
        "Puedes retomar un recorrido pausado o repetirlo desde el comienzo. El progreso se guarda por usuario y empresa en este navegador; no se comparte con otros dispositivos.",
      ),
    ],
  },
  {
    id: "leads",
    title: "Buscar y organizar leads",
    category: "Trabajo comercial",
    icon: "mdi:account-search-outline",
    module: "LEADS",
    description:
      "Filtros, origen, responsable, asignaciones y acceso al seguimiento.",
    path: "/leads",
    ready: '[data-tour="leads-page"]',
    steps: [
      step(
        "Tu lista de leads",
        "Cada fila o tarjeta representa un contacto comercial. Revisa origen, etapa y responsable antes de actuar.",
        '[data-tour="leads-page"]',
      ),
      step(
        "Buscar y filtrar",
        "Usa el buscador por nombre, correo o teléfono. Combina fechas, origen publicitario, tipo, estado y asignación para localizar tu cartera.",
        '[data-tour="filters"]',
      ),
      step(
        "Mis leads y el equipo",
        "Mis leads y sin asignar reúne tu trabajo y los contactos libres. Los administradores pueden filtrar por otros asesores. Un filtro activo puede explicar por qué no encuentras un contacto.",
        '[data-tour="filters"]',
      ),
      step(
        "Compra, Venta u Otro",
        "El tipo determina el embudo comercial. Primero identifica qué necesita el cliente; luego clasifícalo en el detalle. Un contacto sin clasificar puede tener restricciones para avanzar.",
      ),
      step(
        "Origen del contacto",
        "Los indicadores distinguen Meta, WhatsApp y registros manuales. Campaña y anuncio ayudan a entender de dónde viene el interés y qué oferta consultó.",
      ),
      step(
        "Responsable y usuarios desactivados",
        "El nombre del asesor indica quién conserva el lead. Un icono de usuario desactivado avisa que la asignación es anterior y debe revisarse: desactivar una cuenta no redistribuye sus contactos.",
      ),
      step(
        "Tomar un lead libre",
        "La acción Tomar lead está disponible para contactos sin asignar. Verifica que puedes atenderlo: al tomarlo queda en tu cartera. Durante el recorrido no ejecutamos esta acción.",
      ),
      {
        ...step(
          "Asignar, reasignar o liberar",
          "Como administrador puedes elegir un asesor activo o liberar el lead. Reasignar cambia al responsable comercial; revisa la atención del chat y los seguimientos pendientes al hacer el cambio.",
        ),
        admin: true,
      },
      step(
        "Abrir el detalle",
        "Abre un lead para ver datos, pipeline, visitas, conversaciones e historial. Con el detalle abierto, pulsa Recorrido de esta pantalla para aprender su gestión completa.",
      ),
      step(
        "Más resultados",
        "La paginación cambia el grupo de contactos visible. Si buscas un lead antiguo, revisa también las fechas y los filtros.",
        '[data-tour="pagination"]',
      ),
    ],
  },
  {
    id: "lead-detalle",
    title: "Gestionar un lead de principio a fin",
    category: "Trabajo comercial",
    icon: "mdi:account-cog-outline",
    module: "LEADS",
    description:
      "Clasificación, asignación, etapas, cierres, visitas e historial de un lead abierto.",
    path: "/leads",
    match: "^/leads/(?!tablero$)[^/]+$",
    ready: '[data-tour="lead-detail"]',
    steps: [
      step(
        "Conoce al contacto",
        "Comprueba nombre, teléfono, correo y origen. Revisa su historial antes de iniciar una nueva conversación.",
        '[data-tour="lead-detail"]',
      ),
      step(
        "Responsable comercial",
        "La asignación define quién lleva el seguimiento. Si el asesor está desactivado, el aviso indica que hace falta asumir o transferir el lead.",
        '[data-tour="lead-assignment"]',
      ),
      step(
        "Clasificar el interés",
        "Elige Compra, Venta u Otro según la necesidad real. Cambiar el tipo cuando ya avanzó puede reiniciar el embudo y cancelar visitas pendientes; lee la confirmación antes de aceptarla.",
        '[data-tour="lead-pipeline"]',
      ),
      step(
        "Etapas configuradas por la empresa",
        "La barra y los botones usan el pipeline guardado para este tipo. Solo se ofrecen transiciones permitidas desde el estado actual; no todas las etapas son destinos válidos.",
        '[data-tour="lead-pipeline"]',
      ),
      step(
        "Datos que exige cada etapa",
        "Al avanzar puede abrirse un formulario de calificación, visita o negociación. Completa la información solicitada y confirma únicamente cuando sea correcta. Cancelar conserva el estado anterior.",
      ),
      step(
        "Ganado, perdido o descartado",
        "Los cierres requieren un motivo. Registra una nota útil para el equipo. Ganado representa una operación lograda; perdido y descartado permiten explicar por qué terminó la gestión.",
      ),
      {
        ...step(
          "Reabrir un lead",
          "Los administradores pueden reabrir un contacto cerrado hacia las etapas que ofrece el sistema. La reapertura se registra y puede pedir información adicional.",
        ),
        admin: true,
      },
      {
        ...step(
          "Inmueble de interés",
          "Vincula la propiedad correcta del catálogo. Este vínculo ayuda a contextualizar el seguimiento y las visitas, sin sustituir sus datos específicos.",
          '[data-tour="lead-property"]',
        ),
        module: "INMUEBLES",
      },
      step(
        "Visitas y agenda",
        "Revisa las citas del contacto, programa cuando corresponda y registra el resultado después. Las visitas alimentan también la agenda del equipo.",
        "#visitas-agenda",
      ),
      {
        ...step(
          "Continuar por WhatsApp",
          "Iniciar chat abre o prepara la conversación vinculada cuando el teléfono y la conexión lo permiten. Confirma el contacto antes de enviar.",
          '[data-tour="lead-chat"]',
        ),
        module: "WHATSAPP",
      },
      step(
        "Historial y próxima acción",
        "Consulta cambios de etapa y notas para evitar repetir preguntas. Antes de terminar, deja claro el siguiente paso y su fecha. El recorrido no modifica al contacto.",
      ),
    ],
  },
  {
    id: "tablero",
    title: "Trabajar con el tablero comercial",
    category: "Trabajo comercial",
    icon: "mdi:view-column-outline",
    module: "LEADS",
    description:
      "Columnas del pipeline, filtros y movimiento de leads entre etapas.",
    path: "/leads/tablero",
    ready: '[data-tour="kanban-page"]',
    steps: [
      step(
        "Una vista por etapa",
        "Las columnas representan estados del pipeline. Cada tarjeta conserva el tipo y el responsable del lead.",
        '[data-tour="kanban-page"]',
      ),
      step(
        "Todos o un tipo concreto",
        "Todos combina los embudos. Compra, Venta y Otro muestran el recorrido correspondiente; las etiquetas y el orden se toman de la configuración de tu empresa.",
        '[data-tour="kanban-types"]',
      ),
      step(
        "Buscar una tarjeta",
        "Busca por nombre, teléfono o correo. Si no aparece, revisa el tipo seleccionado y la página visible.",
        "#kanban-buscar-lead",
      ),
      step(
        "Mover un lead",
        "Arrastra una tarjeta a una columna permitida. El tablero aplica las mismas reglas que el detalle: un salto no autorizado se rechaza.",
      ),
      step(
        "Completar antes de avanzar",
        "Una etapa puede exigir clasificación, nota, datos de visita o motivo de cierre. El movimiento solo se confirma después de completar el formulario.",
      ),
      step(
        "Revisar una tarjeta",
        "Abre el detalle para consultar antecedentes y gestionar el lead. Tomar está disponible en contactos libres; los avisos de usuario desactivado requieren revisar la asignación.",
      ),
      step(
        "Etapas anteriores",
        "Si una etapa fue quitada del pipeline y aún conserva leads, estos siguen visibles. Abre su detalle y coordina una gestión válida con un administrador.",
      ),
      step(
        "Cerrar la jornada",
        "Revisa qué contactos no avanzaron y programa sus siguientes acciones. La cantidad de tarjetas visible depende de los filtros y de la paginación.",
        '[data-tour="pagination"]',
      ),
    ],
  },
  {
    id: "agenda",
    title: "Planificar y completar actividades",
    category: "Trabajo comercial",
    icon: "mdi:calendar-check-outline",
    module: "LEADS",
    description:
      "Calendario, programación, visitas, resultados y seguimiento del equipo.",
    path: "/agenda",
    ready: '[data-tour="agenda-page"]',
    steps: [
      step(
        "Tu agenda de trabajo",
        "Aquí se reúnen actividades y visitas. Revisa horarios y pendientes antes de coordinar una cita con el cliente.",
        '[data-tour="agenda-page"]',
      ),
      step(
        "Moverte por el calendario",
        "Usa anterior, siguiente y hoy para cambiar de fecha. Según el tamaño de pantalla tendrás diferentes vistas; en móvil se prioriza la lectura compacta.",
        ".agenda-calendar",
      ),
      {
        ...step(
          "Filtrar por asesor",
          "Puedes revisar la agenda de otros asesores o del equipo. Confirma de quién es la actividad antes de modificarla.",
          '[data-tour="page-header"]',
        ),
        admin: true,
      },
      step(
        "Nueva actividad",
        "El botón abre la programación de llamada, reunión, seguimiento o visita. Elige un lead cuando corresponda y escribe un título que explique el objetivo.",
        '[data-tour="agenda-create"]',
      ),
      step(
        "Fechas y duración",
        "Completa inicio, duración y responsable. El sistema valida el horario y los cruces aplicables; no basta con elegir una casilla libre visualmente.",
      ),
      {
        ...step(
          "Visitar un inmueble",
          "En una visita, selecciona la propiedad y modalidad y comprueba la referencia. Las visitas creadas desde el pipeline conservan su vínculo con el lead.",
        ),
        module: "INMUEBLES",
      },
      step(
        "Consultar y editar",
        "Abre un evento del calendario para ver el detalle. Si la cita cambia, actualiza la programación y revisa la información antes de guardar.",
      ),
      step(
        "Registrar el resultado",
        "Después de atender, completa o registra el resultado que ofrece el formulario. No show y cancelada describen situaciones distintas y ayudan a planificar el siguiente contacto.",
      ),
      step(
        "Continuidad del seguimiento",
        "Si el cliente necesita otro contacto, programa una nueva actividad. Revisa también la próxima acción en el detalle del lead.",
      ),
    ],
  },
  {
    id: "chats",
    title: "Encontrar y priorizar conversaciones",
    category: "Atención al cliente",
    icon: "mdi:forum-outline",
    module: "WHATSAPP",
    description:
      "Bandeja, búsquedas, pendientes, responsable y acceso a la atención.",
    path: "/chats",
    ready: '[data-tour="chats-shell"]',
    steps: [
      step(
        "Tu bandeja de WhatsApp",
        "La lista reúne los chats de los contactos. En móvil eliges primero una conversación y puedes volver a la bandeja desde su cabecera.",
        '[data-tour="chats-sidebar"]',
      ),
      step(
        "Buscar un chat",
        "Escribe en el buscador para localizar una conversación. Revisa el filtro de visibilidad si no aparece en la lista.",
        '[placeholder="Buscar un chat"]',
      ),
      step(
        "Mis chats y Todos",
        "El selector cambia entre la vista personal y las conversaciones que puedes consultar en la empresa. Poder ver un chat no significa tener permiso para responderlo.",
      ),
      step(
        "Qué muestra cada fila",
        "Verás nombre, origen, asesor asignado, último mensaje y hora. El contador indica mensajes pendientes; el estado de atención ayuda a distinguir bot y atención humana.",
      ),
      step(
        "Asesor desactivado",
        "El icono junto al nombre explica que el lead mantiene una asignación anterior. Un responsable autorizado debe asumirlo o transferirlo a un asesor activo.",
      ),
      step(
        "Borradores",
        "Si dejas texto pendiente en una conversación, puedes ver Borrador en la lista. Revisarlo antes de enviar evita responder con un texto desactualizado.",
      ),
      step(
        "Abrir y aprender a atender",
        "Abre una conversación y usa el botón de ayuda de la cabecera para iniciar el recorrido de Atención de un chat o Mensajes y archivos.",
      ),
      step(
        "Más conversaciones",
        "Cambia de página para revisar otros resultados. La búsqueda y los filtros afectan al total que ves.",
        '[data-tour="pagination"]',
      ),
    ],
  },
  {
    id: "chat-atencion",
    title: "Asumir, transferir y gestionar un chat",
    category: "Atención al cliente",
    icon: "mdi:account-switch-outline",
    module: "WHATSAPP",
    description:
      "Responsable, bot, toma humana, transferencia, búsqueda y bloqueo.",
    path: "/chats",
    match: "^/chats/[^/]+$",
    ready: '[data-tour="chat-detail"]',
    steps: [
      step(
        "Verifica a quién estás atendiendo",
        "La cabecera identifica al contacto y al responsable del lead. Comprueba el teléfono o identidad antes de continuar.",
        '[data-tour="chat-contact"]',
      ),
      step(
        "Responsable desactivado",
        "Si el responsable anterior está desactivado, verás un icono de aviso. Sus leads no se redistribuyen al suspenderlo: hay que asumir la gestión o transferirla.",
      ),
      step(
        "Quién atiende ahora",
        "Humano, Bot, Pendiente o Pausado describe el control de atención. Abre este indicador fuera del recorrido para ver el responsable y las opciones disponibles.",
        '[aria-label="Control de atención"]',
      ),
      step(
        "Tomar o asumir atención",
        "La toma permite detener al bot y atender. En chats humanos ajenos, un administrador puede asumir la gestión y el lead. Si hay un envío anterior en curso, espera a que termine.",
      ),
      step(
        "Transferir a otro asesor",
        "Transferir atención permite elegir un miembro activo. Al confirmar, el asesor elegido recibe la atención y también la asignación del lead; podrá encontrarlo en sus chats.",
        '[aria-label="Transferir atención"]',
      ),
      step(
        "Volver al bot",
        "Asignar al bot es una acción explícita y depende de permisos y disponibilidad. Cerrar el chat o salir del recorrido no reactiva la automatización.",
      ),
      step(
        "Historial de atención",
        "Consulta quién tomó, transfirió o devolvió la conversación al bot. Este registro explica cambios de responsable y situaciones de atención pendiente.",
      ),
      {
        ...step(
          "Inmueble y próxima actividad",
          "Los accesos de inmueble y actividad ayudan a vincular el interés y programar el seguimiento sin perder la conversación.",
        ),
        module: "INMUEBLES",
      },
      step(
        "Buscar antecedentes",
        "La lupa busca mensajes y permite revisar fechas. Antes de repetir una consulta al cliente, revisa lo que ya conversó con el equipo.",
        '[aria-label="Buscar mensajes"]',
      ),
      step(
        "Bloquear y desbloquear",
        "El icono de bloqueo abre una confirmación. Úsalo solo cuando corresponde: el estado bloqueado impide continuar el intercambio hasta desbloquear.",
        '[aria-label="Bloquear contacto"], [aria-label="Desbloquear contacto"]',
      ),
      step(
        "Acciones en pantallas pequeñas",
        "En móvil, varias acciones se agrupan en Más acciones. Los permisos y las confirmaciones se conservan aunque cambie la ubicación del botón.",
      ),
    ],
  },
  {
    id: "chat-mensajes",
    title: "Mensajes, archivos y llamadas desde un chat",
    category: "Atención al cliente",
    icon: "mdi:message-text-outline",
    module: "WHATSAPP",
    description:
      "Ventana de WhatsApp, texto, adjuntos, audios, plantillas y permisos de llamada.",
    path: "/chats",
    match: "^/chats/[^/]+$",
    ready: '[data-tour="chat-detail"]',
    steps: [
      step(
        "Antes de responder",
        "Confirma el contacto, el responsable de atención y el último mensaje recibido. Los permisos, el bloqueo y la ventana de WhatsApp pueden limitar el envío.",
        '[data-tour="chat-contact"]',
      ),
      step(
        "Ventana de atención",
        "La disponibilidad del campo de escritura depende de la conversación y de las reglas de WhatsApp. Fuera de la ventana, utiliza las opciones de plantilla disponibles en lugar de insistir con texto libre.",
      ),
      step(
        "Escribir y enviar",
        "Redacta en el cuadro inferior y revisa el contenido antes de pulsar Enviar. El recorrido no escribe ni envía mensajes.",
        '[aria-label="Enviar mensajes"]',
      ),
      step(
        "Adjuntar contenido",
        "El botón de adjuntar ofrece los tipos de contenido habilitados: archivos, imágenes y otras opciones del chat. Revisa la vista previa y el contacto antes de confirmar.",
        '[aria-label="Adjuntar"]',
      ),
      step(
        "Emojis, GIFs y stickers",
        "Estas opciones complementan la respuesta. Elige contenido adecuado al cliente y revisa el mensaje antes del envío.",
        '[aria-label="Emojis, GIFs y stickers"]',
      ),
      step(
        "Notas de voz",
        "El micrófono permite grabar; durante la grabación aparecen opciones para cancelar o enviar. La primera vez el navegador puede solicitar permiso de micrófono.",
        '[aria-label="Grabar nota de voz"]',
      ),
      step(
        "Responder, reaccionar y reenviar",
        "Las acciones del mensaje sirven para responder con contexto, reaccionar o reenviar. Antes de reenviar, confirma destinatario y contenido: no todas las acciones cambian lo que el cliente ve de la misma forma.",
      ),
      step(
        "Estados del mensaje",
        "Los indicadores de envío, entrega, lectura o fallo ayudan a saber qué ocurrió. Un fallo requiere revisar el aviso antes de volver a intentar; no asumas que el cliente ya recibió el contenido.",
      ),
      step(
        "Llamadas por WhatsApp",
        "Usa el teléfono cuando esté disponible. Puede ser necesario solicitar permiso de llamada al contacto y autorizar el micrófono del navegador.",
        '[aria-label="Llamar por WhatsApp"], [aria-label="Pedir permiso de llamada"]',
      ),
      step(
        "Dejar el siguiente paso",
        "Después de atender, registra el seguimiento en el lead o agenda. Si cambias de conversación, verifica el borrador antes de retomarlo.",
      ),
    ],
  },
  {
    id: "llamadas",
    title: "Revisar el historial de llamadas",
    category: "Atención al cliente",
    icon: "mdi:phone-log-outline",
    module: "WHATSAPP",
    description:
      "Filtros, dirección, resultado, duración y enlaces al contacto.",
    path: "/llamadas",
    ready: '[data-tour="calls-page"]',
    steps: [
      step(
        "Registro de llamadas",
        "Esta pantalla reúne las llamadas de WhatsApp registradas por el sistema. La disponibilidad para llamar se gestiona desde el chat.",
        '[data-tour="calls-page"]',
      ),
      step(
        "Acotar el historial",
        "Usa los filtros visibles de la pantalla para localizar la fecha, dirección o asesor que necesitas. Las opciones dependen de tus permisos.",
        '[data-tour="calls-filters"]',
      ),
      step(
        "Entrante y saliente",
        "La dirección indica si el contacto llamó o el equipo inició la llamada. No implica por sí misma que la conversación haya sido atendida.",
      ),
      step(
        "Resultado y duración",
        "Revisa ambos datos: una llamada rechazada, perdida o fallida necesita un seguimiento distinto a una llamada completada.",
      ),
      step(
        "Volver al contacto",
        "Los enlaces Chat y Lead permiten retomar el contexto. Antes de devolver una llamada revisa las notas y el responsable actual.",
      ),
      step(
        "Revisar otros resultados",
        "La paginación permite consultar más registros sin perder el filtro aplicado.",
        '[data-tour="pagination"]',
      ),
    ],
  },
  {
    id: "inmuebles",
    title: "Consultar el catálogo de inmuebles",
    category: "Trabajo comercial",
    icon: "mdi:home-search-outline",
    module: "INMUEBLES",
    description:
      "Buscar propiedades, revisar disponibilidad y acceder a sus datos.",
    path: "/inmuebles",
    ready: '[data-tour="properties-page"]',
    steps: [
      step(
        "Inventario comercial",
        "Aquí se centralizan las propiedades que se usan en la gestión de leads y visitas. Confirma los datos antes de ofrecer una propiedad.",
        '[data-tour="properties-page"]',
      ),
      step(
        "Buscar y filtrar",
        "Combina los filtros disponibles para encontrar código, tipo, estado o referencia. Un filtro activo puede ocultar propiedades que sí existen.",
        '[data-tour="filters"]',
      ),
      step(
        "Disponibilidad y precio",
        "Revisa estado comercial, moneda y precio. No confundas un lead ganado con la disponibilidad actual de una propiedad: son registros distintos.",
      ),
      step(
        "Abrir una propiedad",
        "El detalle muestra su información y, si existen, unidades vinculadas. Con una ficha abierta puedes iniciar su recorrido específico desde la cabecera.",
      ),
      {
        ...step(
          "Registrar y editar",
          "Los administradores tienen acceso a Nuevo inmueble y a edición. Completa la ficha con datos verificables y guarda cuando la información esté lista.",
          '[data-tour="page-header"]',
        ),
        admin: true,
      },
      step(
        "Usarlo en el seguimiento",
        "Desde un lead o chat puedes vincular el inmueble de interés. Al programar una visita, confirma también la propiedad concreta que conocerá el cliente.",
      ),
    ],
  },
  {
    id: "inmueble-detalle",
    title: "Conocer la ficha de una propiedad",
    category: "Trabajo comercial",
    icon: "mdi:home-city-outline",
    module: "INMUEBLES",
    description:
      "Información comercial, unidades y opciones de una propiedad abierta.",
    path: "/inmuebles",
    match: "^/inmuebles/(?!nuevo$)[^/]+$",
    ready: '[data-tour="property-detail"]',
    steps: [
      step(
        "Identificar la propiedad",
        "Comprueba código y título para no confundir fichas con nombres similares.",
        '[data-tour="property-detail"]',
      ),
      step(
        "Datos comerciales",
        "Revisa tipo, dirección, precio, moneda y estado antes de proponer la propiedad a un cliente.",
      ),
      step(
        "Información y unidades",
        "Cuando existan unidades o datos relacionados, revisa cada registro y su disponibilidad específica. La ficha principal no sustituye la información de una unidad.",
      ),
      {
        ...step(
          "Editar la ficha",
          "La opción de edición está disponible según tu rol. Verifica los cambios antes de guardar: se usarán en las próximas consultas del equipo.",
          '[data-tour="page-header"]',
        ),
        admin: true,
      },
      step(
        "Continuar con el cliente",
        "Vuelve al lead o chat y vincula esta propiedad cuando corresponda. Registra la siguiente acción para mantener continuidad comercial.",
      ),
    ],
  },
  {
    id: "inmueble-formulario",
    title: "Registrar una propiedad",
    category: "Administración",
    icon: "mdi:home-plus-outline",
    module: "INMUEBLES",
    admin: true,
    description: "Código, título, tipo, dirección, precio, estado y guardado.",
    path: "/inmuebles/nuevo",
    ready: '[data-tour="property-form"]',
    steps: [
      step(
        "Crear una ficha",
        "Este formulario registra una propiedad en el catálogo. Durante el recorrido los campos están protegidos y no se guarda nada.",
        '[data-tour="property-form"]',
      ),
      step(
        "Código de referencia",
        "Usa un código claro que el equipo pueda reconocer y buscar. Revisa antes si la propiedad ya existe.",
        "#codigo",
      ),
      step(
        "Título comercial",
        "Escribe una descripción breve que permita distinguirla de propiedades similares.",
        "#titulo",
      ),
      step(
        "Tipo y dirección",
        "Selecciona el tipo correcto y completa la ubicación con información útil para las visitas.",
        "#direccion",
      ),
      step(
        "Precio y moneda",
        "Registra el importe y la moneda coherentemente. Evita presentar al cliente un valor sin confirmar su moneda.",
        "#precio",
      ),
      step(
        "Estado y validaciones",
        "El estado indica la situación de la propiedad. Revisa campos obligatorios y mensajes de validación antes de guardar.",
      ),
      step(
        "Guardar o cancelar",
        "Fuera del recorrido puedes guardar la ficha o volver al catálogo. No se crea una propiedad por completar esta explicación.",
      ),
    ],
  },
  {
    id: "dashboard",
    title: "Interpretar el dashboard",
    category: "Administración",
    icon: "mdi:chart-box-outline",
    module: "DASHBOARD",
    admin: true,
    description:
      "Filtros, indicadores comerciales y lectura de resultados del equipo.",
    path: "/dashboard",
    ready: '[data-tour="dashboard-page"]',
    steps: [
      step(
        "Indicadores de la empresa",
        "El dashboard reúne resultados a nivel de organización. Es una vista para propietarios y administradores.",
        '[data-tour="dashboard-page"]',
      ),
      step(
        "Definir el período",
        "Aplica fechas y filtros antes de comparar cifras. Un cambio de período modifica el contexto de todos los indicadores afectados.",
        '[data-tour="filters"]',
      ),
      step(
        "Origen publicitario",
        "Las opciones de Meta permiten acotar los resultados según los recursos vinculados. Una campaña sin datos en el período puede no aportar resultados visibles.",
      ),
      step(
        "Leer cada indicador",
        "Revisa el nombre y las ayudas del indicador. Leads, conversaciones y operaciones representan hechos diferentes; no deben interpretarse como la misma cantidad.",
      ),
      step(
        "Comparar con contexto",
        "Relaciona volumen, etapa y actividad del equipo. Los filtros y los cambios de asignación pueden explicar diferencias con la lista de trabajo.",
      ),
      step(
        "Pasar de la cifra a la acción",
        "Usa los hallazgos para revisar leads pendientes, redistribuir carga o programar seguimiento. El recorrido no modifica campañas ni presupuestos.",
      ),
    ],
  },
  {
    id: "configuracion",
    title: "Configurar el CRM de la empresa",
    category: "Administración",
    icon: "mdi:cog-outline",
    admin: true,
    description:
      "Empresa, usuarios, pipeline, reparto automático y conexiones habilitadas.",
    path: "/settings",
    ready: '[data-tour="settings-page"]',
    steps: [
      step(
        "Configuración de la empresa",
        "Las opciones visibles dependen de los módulos contratados y tu rol. Los cambios que guardes fuera del recorrido pueden afectar al trabajo del equipo.",
        '[data-tour="settings-page"]',
      ),
      section(
        "Usuarios",
        "Desde aquí accedes a los miembros, roles, estado de acceso y reasignación de cartera. Hay un recorrido específico para administrar usuarios.",
      ),
      section(
        "Datos de la empresa",
        "Revisa nombre y datos de contacto de la organización. Mantén la zona horaria y la información de la empresa coherentes con su operación.",
      ),
      {
        ...section(
          "Pipeline de leads",
          "Define estados, etiquetas y transiciones por Compra, Venta u Otro. Los cambios guardados se reflejan en el detalle y el tablero; no mueven automáticamente los leads existentes.",
        ),
        module: "LEADS",
      },
      {
        ...step(
          "Editar el embudo",
          "Elige un tipo, ajusta los nombres visibles y marca a qué etapas puede pasar cada estado. Los códigos identifican las etapas; las etiquetas son los nombres que ve el equipo.",
          '[aria-label="Tipo de embudo"]',
        ),
        module: "LEADS",
      },
      {
        ...step(
          "Guardar o restaurar el pipeline",
          "Guardar aplica el borrador. Ver valores por defecto solo los carga en el editor; Restaurar valores por defecto elimina la personalización guardada. Revisa el efecto antes de confirmar cambios.",
        ),
        module: "LEADS",
      },
      {
        ...section(
          "Asignación automática de leads",
          "Configura los asesores activos y su orden de reparto. Los límites diarios, cuando se establecen, condicionan cuántos leads puede recibir cada uno.",
        ),
        module: "LEADS",
      },
      {
        ...step(
          "Cupos y responsables",
          "Agotar cupos puede dejar leads sin asignar para gestión manual. Desactivar un usuario no transfiere sus leads anteriores: revisa sus avisos y redistribuye la cartera cuando corresponda.",
        ),
        module: "LEADS",
      },
      {
        ...section(
          "Catálogo de inmuebles",
          "Mantén el inventario que el equipo utiliza en la gestión comercial y las visitas.",
        ),
        module: "INMUEBLES",
      },
      {
        ...section(
          "Meta Lead Ads",
          "Gestiona la conexión y los recursos autorizados de Meta. Revisa páginas y cuentas vinculadas cuando no ingresen los leads esperados.",
        ),
        module: "META_LEADS",
      },
      {
        ...section(
          "WhatsApp",
          "Vincula el número de empresa y consulta plantillas y estado de conexión. El recorrido específico explica esta pantalla.",
        ),
        module: "WHATSAPP",
      },
      {
        ...section(
          "Automatizaciones · Bot de WhatsApp",
          "La disponibilidad del bot depende de su autorización e integración. Revisa el modo por defecto de los chats nuevos y las acciones explícitas de toma humana.",
        ),
        module: "AUTOMATIZACIONES",
      },
      step(
        "Revisión final",
        "Haz cambios de forma deliberada y comprueba el resultado con el equipo. Puedes repetir esta guía cuando incorpores un módulo o un administrador nuevo.",
      ),
    ],
  },
  {
    id: "usuarios",
    title: "Administrar usuarios y su cartera",
    category: "Administración",
    icon: "mdi:account-group-outline",
    admin: true,
    description:
      "Roles, altas, desactivación, reactivación y transferencia de leads pendientes.",
    path: "/settings/users",
    ready: '[data-tour="users-page"]',
    steps: [
      step(
        "Miembros de la empresa",
        "Esta pantalla controla quién forma parte del equipo y qué puede hacer. Revisa nombre, rol y estado antes de aplicar cambios.",
        '[data-tour="users-page"]',
      ),
      step(
        "Buscar y filtrar usuarios",
        "Localiza al miembro por los filtros disponibles. La suspensión de cuenta y la desactivación de membresía representan niveles de acceso distintos.",
        '[data-tour="filters"]',
      ),
      step(
        "Límite de usuarios",
        "La capacidad del plan puede limitar nuevas altas y reactivaciones. Revisa el cupo antes de incorporar a alguien.",
      ),
      step(
        "Incorporar un miembro",
        "Usa el alta disponible para registrar o vincular al usuario. Confirma datos y rol; entrega el acceso por el procedimiento autorizado de la empresa.",
      ),
      step(
        "Elegir el rol",
        "Propietario y Administrador gestionan la empresa. Usuario se orienta a atención y seguimiento. Otorga el rol que la persona necesita para su trabajo.",
      ),
      step(
        "Desactivar acceso",
        "Desactivar impide continuar el uso conforme al estado de cuenta y membresía. El sistema protege situaciones como quedarse sin propietario activo o desactivarse a uno mismo.",
      ),
      step(
        "Leads anteriores pendientes",
        "Los leads no se redistribuyen simplemente por desactivar a alguien. El aviso de usuario desactivado señala la cartera que necesita asumir o transferir a un responsable activo.",
      ),
      step(
        "Reasignar cartera",
        "Usa la reasignación disponible y elige un destinatario activo de esta empresa. Revisa el alcance y la confirmación: cambia la responsabilidad real de los contactos.",
      ),
      step(
        "Reactivar y verificar",
        "Para reactivar deben cumplirse los requisitos de cuenta y cupo. Después revisa su rol, las asignaciones y si debe volver al reparto automático.",
      ),
    ],
  },
  {
    id: "meta",
    title: "Revisar la conexión con Meta",
    category: "Administración",
    icon: "mdi:facebook",
    admin: true,
    module: "META_LEADS",
    description:
      "Conexión, permisos, páginas, cuentas publicitarias y recursos vinculados.",
    path: "/settings/meta",
    ready: '[data-tour="meta-settings"]',
    steps: [
      step(
        "Conexión de Meta",
        "Este centro reúne la conexión y los recursos de Meta disponibles para la empresa. Revisa la cuenta autorizada antes de vincular activos.",
        '[data-tour="meta-settings"]',
      ),
      step(
        "Conectar o renovar permisos",
        "La autorización puede abrir el proceso oficial de Meta. Usa una cuenta con acceso a los recursos correctos y revisa los permisos solicitados.",
      ),
      step(
        "Páginas de Facebook",
        "Las páginas vinculadas identifican fuentes de leads y datos de negocio. Abre su sección para revisar cuáles pertenecen a esta empresa.",
        'a[href="/settings/meta/pages"]',
      ),
      step(
        "Cuentas publicitarias",
        "Vincula las cuentas necesarias para campañas y anuncios. No confundas la cuenta publicitaria con una página: cumplen funciones diferentes.",
        'a[href="/settings/meta/ad-accounts"]',
      ),
      step(
        "Cuando faltan leads",
        "Comprueba estado de conexión, permisos, página y recursos vinculados. Verifica también filtros de fecha en leads y dashboard antes de concluir que falta información.",
      ),
      step(
        "Cambios de integración",
        "Vincular o desconectar recursos tiene efectos reales. El recorrido solo explica la pantalla; no autoriza cuentas ni cambia conexiones.",
      ),
    ],
  },
  {
    id: "whatsapp-config",
    title: "Configurar WhatsApp y sus plantillas",
    category: "Administración",
    icon: "mdi:whatsapp",
    admin: true,
    module: "WHATSAPP",
    description:
      "Número de empresa, conexión, recursos disponibles y plantillas de mensajes.",
    path: "/settings/whatsapp",
    ready: '[data-tour="whatsapp-settings"]',
    steps: [
      step(
        "Número de WhatsApp de la empresa",
        "Desde aquí vinculas los números autorizados y consultas el estado de conexión que utiliza el CRM.",
        '[data-tour="whatsapp-settings"]',
      ),
      step(
        "Elegir un número disponible",
        "Comprueba nombre verificado y número antes de vincular. Si no aparece, revisa la cuenta de WhatsApp Business y los permisos de Meta.",
      ),
      step(
        "Estado de la conexión",
        "La tarjeta de cada número permite revisar su situación y las opciones habilitadas. Resolver la conexión puede ser necesario antes de atender desde Chats.",
      ),
      step(
        "Plantillas",
        "Las plantillas sirven para mensajes aprobados y situaciones donde el texto libre no está disponible. Revisa nombre, idioma, estado y contenido antes de utilizarlas.",
      ),
      step(
        "Variables y contenido",
        "Cuando una plantilla contiene variables, completa la información correcta del destinatario. Una plantilla no debe enviarse sin revisar su vista previa.",
      ),
      step(
        "Comprobar la operación",
        "Vuelve a un chat para revisar disponibilidad. La autorización de WhatsApp, las restricciones de envío y los permisos del asesor también influyen.",
      ),
    ],
  },
  {
    id: "perfil",
    title: "Mi perfil y preferencias de acceso",
    category: "Para empezar",
    icon: "mdi:account-outline",
    description: "Datos personales, notificaciones, contraseña y tema visual.",
    path: "/profile",
    ready: '[data-tour="profile-page"]',
    steps: [
      step(
        "Tu cuenta",
        "Comprueba qué usuario está conectado. Tu rol y los módulos de la empresa determinan las opciones que puedes ver.",
        '[data-tour="profile-page"]',
      ),
      step(
        "Datos personales",
        "Actualiza nombre, apellido y teléfono cuando corresponda. El correo identifica la cuenta y puede no ser editable desde este formulario.",
        '[data-tour="profile-data"]',
      ),
      step(
        "Notificaciones",
        "La tarjeta de permisos te ayuda a habilitar los avisos del navegador. Si no llegan, revisa también los permisos del sitio y del dispositivo.",
        '[data-tour="profile-page"]',
      ),
      step(
        "Contraseña",
        "Introduce la contraseña actual y una nueva válida únicamente cuando quieras cambiarla. El recorrido no lee ni rellena estos campos.",
        '[data-tour="profile-password"]',
      ),
      step(
        "Tema visual",
        "El botón de la cabecera permite cambiar entre modo claro y oscuro. La guía mantiene legibilidad en ambos temas.",
        '[data-tour="app-header"]',
      ),
      step(
        "Volver a aprender",
        "Guía del sistema conserva tus recorridos disponibles. Repetir una guía no reinicia ni modifica tu trabajo comercial.",
        '[data-tour-nav="/ayuda"]',
      ),
    ],
  },
];

guides.push({
  id: "notificaciones",
  title: "Atender notificaciones y pendientes",
  category: "Para empezar",
  icon: "mdi:bell-outline",
  description:
    "Campana, avisos sin leer, enlaces a la tarea y preferencias del navegador.",
  path: "/notifications",
  ready: '[data-tour="notifications-page"]',
  steps: [
    step(
      "Avisos del sistema",
      "Aquí encontrarás las notificaciones de tu usuario en esta empresa. Revisa los avisos para priorizar tareas y contactos.",
      '[data-tour="notifications-page"]',
    ),
    step(
      "La campana de la cabecera",
      "La campana permite consultar avisos desde otras pantallas. El contador indica elementos pendientes de lectura.",
      '[aria-label="Notificaciones"]',
    ),
    step(
      "Abrir el aviso",
      "Lee su descripción y abre el contacto o tarea vinculada cuando corresponda. Comprueba el contexto antes de ejecutar una acción.",
    ),
    step(
      "Marcar como leído",
      "Leer una notificación no completa una actividad, cambia de etapa ni responde un chat. Esas tareas se realizan en su módulo.",
    ),
    step(
      "Avisos del navegador",
      "Si quieres recibir avisos fuera de esta pantalla, revisa los permisos de notificaciones en Perfil y en el navegador. Los permisos se eligen de forma explícita.",
    ),
  ],
});

for (const resource of [
  {
    id: "meta-paginas",
    title: "Vincular y revisar páginas de Meta",
    path: "/settings/meta/pages",
    label: "Páginas de Meta",
    noun: "página",
    detail: "Formularios y recepción de leads",
    description:
      "Abre la página para revisar información y formularios sincronizados. Su estado ayuda a diagnosticar qué fuentes pueden generar leads.",
  },
  {
    id: "meta-cuentas",
    title: "Vincular cuentas publicitarias",
    path: "/settings/meta/ad-accounts",
    label: "Cuentas publicitarias",
    noun: "cuenta publicitaria",
    detail: "Campañas, conjuntos y anuncios",
    description:
      "Abre una cuenta para revisar las campañas y recursos sincronizados que alimentan los filtros y la lectura comercial.",
  },
]) {
  guides.push({
    id: resource.id,
    title: resource.title,
    category: "Administración",
    icon: "mdi:link-variant",
    admin: true,
    module: "META_LEADS",
    description: `Selección de ${resource.noun}, vinculación, datos sincronizados y desvinculación.`,
    path: resource.path,
    ready: `[data-tour-title="${resource.label}"]`,
    steps: [
      step(
        resource.label,
        `Esta pantalla reúne los recursos vinculados a la empresa. Verifica que cada ${resource.noun} corresponde al negocio correcto.`,
        `[data-tour-title="${resource.label}"]`,
      ),
      step(
        "Agregar un recurso",
        "El selector muestra lo que la cuenta autorizada permite consultar. Si falta un recurso, revisa su acceso y la conexión de Meta antes de volver a intentarlo.",
      ),
      step(
        "Vincular con intención",
        "Seleccionar y confirmar vincula un recurso real. Este recorrido no conecta recursos ni cambia permisos de Meta.",
      ),
      step(resource.detail, resource.description),
      step(
        "Desvincular",
        "La acción de desvinculación deja de asociar el recurso a esta organización. Revisa sus consecuencias antes de usarla; no es un paso necesario para terminar esta guía.",
      ),
      step(
        "Más recursos",
        "La paginación permite revisar otros registros. No confundas la ausencia en una página con la falta de vinculación.",
        '[data-tour="pagination"]',
      ),
    ],
  });
  guides.push({
    id: `${resource.id}-detalle`,
    title: `Revisar el detalle de una ${resource.noun}`,
    category: "Administración",
    icon: "mdi:card-search-outline",
    admin: true,
    module: "META_LEADS",
    description: resource.description,
    path: resource.path,
    match: `^${resource.path}/[^/]+$`,
    ready: '[data-tour="meta-hub"]',
    steps: [
      step(
        "Identidad del recurso",
        "Verifica el nombre y la referencia del recurso abierto. Revisa que estás trabajando en la empresa correcta.",
        '[data-tour="meta-hub"]',
      ),
      step(resource.detail, resource.description),
      step(
        "Consultar los datos sincronizados",
        "Revisa las listas y estados que ofrece la ficha. Un recurso visible en Meta puede no tener información reciente sincronizada en el CRM.",
      ),
      step(
        "Acciones disponibles",
        "Las opciones de la pantalla dependen del recurso y de tus permisos. Lee las ayudas y confirmaciones antes de vincular, sincronizar o desvincular información.",
      ),
      step(
        "Volver al flujo comercial",
        "Usa lo revisado para comprobar los filtros de leads y los indicadores del dashboard. Si falta información, confirma primero fechas, permisos y estado de conexión.",
      ),
    ],
  });
}

const propertyFormGuide = guides.find((g) => g.id === "inmueble-formulario")!;
guides.push({
  ...propertyFormGuide,
  id: "inmueble-editar",
  title: "Editar una propiedad",
  path: "/inmuebles",
  match: "^/inmuebles/[^/]+/editar$",
  description:
    "Revisar los campos de una ficha existente antes de guardar cambios.",
  steps: [
    step(
      "Actualizar una ficha existente",
      "Estás editando una propiedad del catálogo. Revisa sus datos actuales antes de cambiarlos; el recorrido no modifica los campos.",
      '[data-tour="property-form"]',
    ),
    ...propertyFormGuide.steps.slice(1, -1),
    step(
      "Guardar cambios",
      "Al guardar se actualizará la ficha existente. Si decides volver sin guardar, revisa si tienes cambios pendientes. Terminar esta guía no guarda el formulario.",
    ),
  ],
});

export type GuideAccess = Pick<MeResponse, "rol" | "modulos">;
export function hasGuideAccess(
  rule: { admin?: boolean; module?: string },
  access: GuideAccess,
) {
  return (
    (!rule.admin ||
      access.rol === "PROPIETARIO" ||
      access.rol === "ADMINISTRADOR") &&
    (!rule.module ||
      access.modulos.some((m) => m.codigo === rule.module && m.habilitado))
  );
}
export function availableGuides(access: GuideAccess) {
  return guides.filter((guide) => hasGuideAccess(guide, access));
}
export function guideMatches(guide: Guide, pathname: string) {
  return guide.match
    ? new RegExp(guide.match).test(pathname)
    : guide.path === pathname;
}
export function guideSteps(guide: Guide, access: GuideAccess) {
  return guide.steps.filter((s) => hasGuideAccess(s, access));
}

export function guideRecordLabel(guide: Guide) {
  if (guide.path === "/leads") return "lead";
  if (guide.path === "/chats") return "chat";
  if (guide.path === "/inmuebles") return "inmueble";
  if (guide.path === "/settings/meta/pages") return "página";
  if (guide.path === "/settings/meta/ad-accounts") return "cuenta publicitaria";
  return "registro";
}

/** Mantiene la intención al elegir un registro y la descarta al salir del módulo. */
export function guideSelectionState(guide: Guide, pathname: string) {
  if (guideMatches(guide, pathname)) return "ready";
  if (pathname === "/ayuda" || pathname === guide.path || pathname.startsWith(`${guide.path}/`)) return "choose";
  return "leave";
}
