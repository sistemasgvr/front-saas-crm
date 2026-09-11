import type { Metadata } from "next";
import Link from "next/link";
import ConsultarEstadoEliminacionForm from "@/src/modules/legal/ConsultarEstadoEliminacionForm";

export const metadata: Metadata = {
  title: "Eliminación de datos | CRM",
  description:
    "Cómo solicitar la eliminación de datos personales asociados a la app Meta / CRM de Proyectos GVR.",
};

const CONTACTO = "sistemas.gvrpe@gmail.com";

export default function EliminacionDatosPage() {
  return (
    <article className="space-y-6 text-theme-sm leading-relaxed text-gray-700 dark:text-gray-300">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
          Eliminación de datos
        </h1>
        <p className="mt-2 text-theme-xs text-gray-500">
          Cómo pedir que borremos los datos personales vinculados a nuestra app.
        </p>
      </div>

      <section className="space-y-2">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white">
          1. Si conectaste la app desde Facebook
        </h2>
        <p>
          Puedes pedir la eliminación desde Facebook: abre{" "}
          <strong>Configuración y privacidad → Centros de cuentas → Apps y sitios web</strong>,
          localiza nuestra app y solicita quitarla o eliminar la actividad asociada.
        </p>
        <p>Cuando Facebook nos notifica esa solicitud, automáticamente:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Cerramos tu sesión de conexión con Meta en el CRM.</li>
          <li>Eliminamos tokens y datos de tu usuario de Facebook vinculados a esa conexión.</li>
          <li>Te dejamos un código de confirmación para que puedas verificar el resultado.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white">
          2. Consultar el estado de una solicitud
        </h2>
        <p>
          Si Facebook o nuestro sistema te mostraron un <strong>código de confirmación</strong>{" "}
          tras pedir la eliminación, pégalo aquí para ver si ya se procesó:
        </p>
        <ConsultarEstadoEliminacionForm />
        <p className="text-theme-xs text-gray-500 dark:text-gray-400">
          Si no tienes el código, o el resultado no es el esperado, escríbenos a{" "}
          <a className="text-brand-600 underline dark:text-brand-400" href={`mailto:${CONTACTO}`}>
            {CONTACTO}
          </a>
          .
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white">
          3. Usuarios del CRM (sin Facebook)
        </h2>
        <p>
          Si tienes una cuenta en el CRM y quieres que eliminemos tu usuario o los datos de tu
          organización, escribe a{" "}
          <a className="text-brand-600 underline dark:text-brand-400" href={`mailto:${CONTACTO}`}>
            {CONTACTO}
          </a>{" "}
          indicando el correo de la cuenta y la organización. Atenderemos la solicitud en un plazo
          razonable (habitualmente ≤ 30 días), salvo retención legal.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white">
          4. Qué no se borra automáticamente
        </h2>
        <p>
          Los leads y conversaciones de clientes finales de una organización son datos de negocio
          de esa organización. La eliminación pedida por un usuario de Facebook que solo autorizó
          la app <strong>no borra</strong> el histórico de leads de terceros. Esas bajas se
          gestionan con el administrador de la organización o mediante solicitud formal al correo
          anterior.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white">5. Más información</h2>
        <p>
          Ver también la{" "}
          <Link href="/privacidad" className="text-brand-600 underline dark:text-brand-400">
            Política de privacidad
          </Link>{" "}
          y las{" "}
          <Link href="/terminos" className="text-brand-600 underline dark:text-brand-400">
            Condiciones del servicio
          </Link>
          .
        </p>
      </section>
    </article>
  );
}
