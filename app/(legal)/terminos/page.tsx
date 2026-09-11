import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Términos del servicio | CRM",
  description: "Condiciones de uso del CRM de Proyectos GVR e integraciones con Meta.",
};

const CONTACTO = "sistemas.gvrpe@gmail.com";

export default function TerminosPage() {
  return (
    <article className="space-y-6 text-theme-sm leading-relaxed text-gray-700 dark:text-gray-300">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
          Condiciones del servicio
        </h1>
        <p className="mt-2 text-theme-xs text-gray-500">Última actualización: 11 de septiembre de 2026</p>
      </div>

      <section className="space-y-2">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white">1. Aceptación</h2>
        <p>
          Al acceder o usar el CRM de Proyectos GVR (“el Servicio”) aceptas estas condiciones y
          nuestra{" "}
          <Link href="/privacidad" className="text-brand-600 underline dark:text-brand-400">
            Política de privacidad
          </Link>
          . Si no estás de acuerdo, no uses el Servicio.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white">2. Descripción del servicio</h2>
        <p>
          El Servicio es un software SaaS de gestión de leads, agenda, inmuebles y mensajería,
          con integraciones opcionales a Meta (Facebook, Instagram, WhatsApp Business Platform).
          Cada organización cliente configura sus propias credenciales de Meta App cuando
          corresponde.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white">3. Cuentas y acceso</h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>Debes proporcionar información veraz y mantener la confidencialidad de tus credenciales.</li>
          <li>Eres responsable de la actividad realizada con tu cuenta y de los usuarios que invites.</li>
          <li>Nos reservamos el derecho de suspender cuentas por abuso, fraude o incumplimiento.</li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white">4. Uso aceptable</h2>
        <p>Te comprometes a no:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Violar leyes, políticas de Meta/WhatsApp o derechos de terceros.</li>
          <li>Enviar spam, phishing o contenido ilícito a través del canal de mensajería.</li>
          <li>Intentar vulnerar la seguridad, el multi-tenant o las APIs del Servicio.</li>
          <li>Revender el Servicio sin autorización escrita.</li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white">5. Integración con Meta</h2>
        <p>
          El uso de APIs de Meta está sujeto además a los términos y políticas de Meta. Debes
          disponer de los consentimientos y bases legales necesarios para tratar datos de leads y
          contactos. La desconexión o la solicitud de eliminación de datos de un usuario de
          Facebook se gestiona según el{" "}
          <Link href="/eliminacion-datos" className="text-brand-600 underline dark:text-brand-400">
            procedimiento de eliminación
          </Link>
          .
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white">6. Datos del cliente</h2>
        <p>
          Los datos de negocio (leads, chats, inmuebles) pertenecen a la organización cliente. Tú
          nos otorgas una licencia limitada para alojarlos y procesarlos solo para prestar el
          Servicio. Tras la baja de la cuenta, aplicaremos los plazos de borrado o exportación
          acordados contractualmente o, en su defecto, un plazo razonable previo aviso.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white">7. Disponibilidad y cambios</h2>
        <p>
          Procuramos alta disponibilidad, pero el Servicio se ofrece “tal cual”. Podemos modificar
          funciones, siempre que no afecten de forma injustificada obligaciones esenciales. No
          garantizamos la continuidad de APIs de terceros (incluidas las de Meta).
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white">8. Limitación de responsabilidad</h2>
        <p>
          En la máxima medida permitida por la ley, no seremos responsables por daños indirectos,
          lucro cesante o pérdida de datos derivados del uso del Servicio o de interrupciones de
          Meta/WhatsApp. La responsabilidad agregada se limita a las tarifas pagadas por el
          Servicio en los 3 meses previos al reclamo, salvo dolo o negligencia grave.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white">9. Contacto</h2>
        <p>
          Consultas legales o de soporte:{" "}
          <a className="text-brand-600 underline dark:text-brand-400" href={`mailto:${CONTACTO}`}>
            {CONTACTO}
          </a>
          .
        </p>
      </section>
    </article>
  );
}
