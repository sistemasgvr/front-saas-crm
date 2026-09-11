import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Política de privacidad | CRM",
  description:
    "Cómo el CRM de Proyectos GVR trata los datos personales, incluidos los obtenidos mediante Meta (Facebook / Instagram / WhatsApp).",
};

const CONTACTO = "sistemas.gvrpe@gmail.com";

export default function PrivacidadPage() {
  return (
    <article className="prose-legal space-y-6 text-theme-sm leading-relaxed text-gray-700 dark:text-gray-300">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Política de privacidad</h1>
        <p className="mt-2 text-theme-xs text-gray-500">Última actualización: 11 de septiembre de 2026</p>
      </div>

      <section className="space-y-2">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white">1. Responsable</h2>
        <p>
          El responsable del tratamiento es <strong>Proyectos GVR</strong> (en adelante, “nosotros”),
          operador del software CRM alojado en el dominio del servicio (p. ej. crm.proyectosgvr.com).
          Contacto de privacidad:{" "}
          <a className="text-brand-600 underline dark:text-brand-400" href={`mailto:${CONTACTO}`}>
            {CONTACTO}
          </a>
          .
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white">2. Alcance</h2>
        <p>
          Esta política describe cómo tratamos datos personales cuando usas el CRM, incluyendo la
          integración con productos de Meta Platforms, Inc. (Facebook Login / OAuth, páginas de
          Facebook, formularios de leads, WhatsApp Business Platform y APIs relacionadas).
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white">3. Datos que tratamos</h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong>Cuenta CRM:</strong> nombre, correo, contraseña (hash), rol y organización.
          </li>
          <li>
            <strong>Conexión Meta:</strong> identificador de usuario de Facebook que autoriza la app,
            nombre público asociado, tokens de acceso (cifrados), scopes concedidos, IDs de páginas y
            cuentas publicitarias vinculadas.
          </li>
          <li>
            <strong>Leads y CRM:</strong> nombre, teléfono, correo y respuestas de formularios o
            chats, historial de gestión, agenda y mensajes de WhatsApp necesarios para prestar el
            servicio a la organización cliente.
          </li>
          <li>
            <strong>Técnicos:</strong> logs de seguridad, webhooks y métricas operativas.
          </li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white">4. Finalidades</h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>Autenticar usuarios y administrar organizaciones del SaaS.</li>
          <li>Recibir y gestionar leads y mensajes provenientes de Meta / WhatsApp.</li>
          <li>Mostrar campañas, anuncios, insights y estado de conexión con Meta.</li>
          <li>Cumplir obligaciones legales y de seguridad (p. ej. auditoría de accesos).</li>
        </ul>
        <p>
          No vendemos datos personales. No usamos datos obtenidos de Meta para tomar decisiones
          automatizadas con efectos legales sobre consumidores fuera del alcance del CRM contratado
          por cada organización.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white">5. Base y encargados</h2>
        <p>
          Tratamos datos como encargado del tratamiento respecto de los datos de clientes finales
          (leads) que cada organización introduce o recibe vía Meta; y como responsable respecto de
          las cuentas de usuario del CRM y de la conexión OAuth con Meta.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white">6. Conservación</h2>
        <p>
          Conservamos los datos mientras la organización mantenga la cuenta activa o mientras sean
          necesarios para el servicio, resolución de incidencias o obligaciones legales. Los tokens
          de Meta se pueden revocar en cualquier momento desde el CRM (Configuración → Meta) o
          mediante los flujos de eliminación/deautorización de Facebook.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white">7. Seguridad</h2>
        <p>
          Aplicamos cifrado de secretos y tokens en reposo, comunicación HTTPS, control de acceso
          por organización y roles, y verificación criptográfica de webhooks de Meta
          (HMAC-SHA256).
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white">8. Derechos y eliminación</h2>
        <p>
          Puedes solicitar acceso, rectificación o eliminación de tus datos personales escribiendo
          a{" "}
          <a className="text-brand-600 underline dark:text-brand-400" href={`mailto:${CONTACTO}`}>
            {CONTACTO}
          </a>
          . Si autorizaste nuestra app desde Facebook, también puedes solicitar la eliminación
          desde la configuración de Facebook; procesamos esa solicitud mediante nuestro{" "}
          <Link href="/eliminacion-datos" className="text-brand-600 underline dark:text-brand-400">
            procedimiento de eliminación de datos
          </Link>
          .
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white">9. Transferencias y terceros</h2>
        <p>
          Meta procesa datos según sus propias políticas cuando usas Facebook, Instagram o
          WhatsApp. Nosotros solo recibimos los datos necesarios para las APIs que la organización
          habilita. Proveedores de infraestructura (hosting, base de datos) actúan como
          subencargados bajo contrato.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white">10. Cambios</h2>
        <p>
          Podemos actualizar esta política; la fecha de “última actualización” indica la versión
          vigente. El uso continuado del servicio tras un cambio material implica conocimiento de
          la nueva versión.
        </p>
      </section>
    </article>
  );
}
