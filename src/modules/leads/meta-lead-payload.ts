/** Shape de GET /{lead_id} — Marketing API Lead Ads (v26+). */
export interface MetaLeadFieldData {
  name: string;
  values: string[];
}

export interface MetaLeadPayload {
  id?: string;
  created_time?: string;
  ad_id?: string;
  adset_id?: string;
  campaign_id?: string;
  form_id?: string;
  field_data?: MetaLeadFieldData[];
}

const ETIQUETAS_ESTANDAR: Record<string, string> = {
  full_name: "Nombre completo",
  first_name: "Nombre",
  last_name: "Apellido",
  email: "Email",
  phone_number: "Teléfono",
  phone: "Teléfono",
  work_email: "Email laboral",
  work_phone_number: "Teléfono laboral",
  company_name: "Empresa",
  job_title: "Cargo",
  city: "Ciudad",
  state: "Estado / región",
  province: "Provincia",
  country: "País",
  post_code: "Código postal",
  zip: "Código postal",
  zip_code: "Código postal",
  date_of_birth: "Fecha de nacimiento",
  gender: "Género",
  marital_status: "Estado civil",
  relationship_status: "Estado civil",
  military_status: "Situación militar",
};

const ICONOS_ESTANDAR: Record<string, string> = {
  full_name: "mdi:account-outline",
  first_name: "mdi:account-outline",
  last_name: "mdi:account-outline",
  email: "mdi:email-outline",
  work_email: "mdi:email-outline",
  phone_number: "mdi:phone-outline",
  phone: "mdi:phone-outline",
  work_phone_number: "mdi:phone-outline",
  company_name: "mdi:office-building-outline",
  job_title: "mdi:badge-account-outline",
  city: "mdi:city-variant-outline",
  state: "mdi:map-marker-outline",
  province: "mdi:map-marker-outline",
  country: "mdi:earth",
  post_code: "mdi:mailbox-outline",
  zip: "mdi:mailbox-outline",
  zip_code: "mdi:mailbox-outline",
  date_of_birth: "mdi:cake-variant-outline",
  gender: "mdi:gender-male-female",
};

function esObjeto(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === "object" && valor !== null && !Array.isArray(valor);
}

export function parsearMetaLeadPayload(raw: unknown): MetaLeadPayload | null {
  if (!esObjeto(raw)) return null;
  const fieldRaw = raw.field_data;
  const field_data = Array.isArray(fieldRaw)
    ? fieldRaw
        .filter(esObjeto)
        .map((item) => ({
          name: typeof item.name === "string" ? item.name : "",
          values: Array.isArray(item.values)
            ? item.values.filter((v): v is string => typeof v === "string")
            : [],
        }))
        .filter((item) => item.name.length > 0)
    : undefined;

  return {
    id: typeof raw.id === "string" ? raw.id : undefined,
    created_time: typeof raw.created_time === "string" ? raw.created_time : undefined,
    ad_id: typeof raw.ad_id === "string" ? raw.ad_id : undefined,
    adset_id: typeof raw.adset_id === "string" ? raw.adset_id : undefined,
    campaign_id: typeof raw.campaign_id === "string" ? raw.campaign_id : undefined,
    form_id: typeof raw.form_id === "string" ? raw.form_id : undefined,
    field_data,
  };
}

/** Meta usa `snake_case` / guiones bajos en preguntas personalizadas. */
export function etiquetaCampoMeta(name: string): string {
  const key = name.trim().toLowerCase();
  if (ETIQUETAS_ESTANDAR[key]) return ETIQUETAS_ESTANDAR[key];

  const limpio = name.replace(/_/g, " ").replace(/\s+/g, " ").trim();
  if (!limpio) return name;
  if (limpio.startsWith("¿") || limpio.startsWith("¡")) return limpio;
  return limpio.charAt(0).toUpperCase() + limpio.slice(1);
}

export function valorCampoMeta(values: string[]): string {
  if (!values.length) return "—";
  return values
    .map((v) => v.replace(/_/g, " ").replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .join(", ");
}

export function iconoCampoMeta(name: string): string {
  return ICONOS_ESTANDAR[name.trim().toLowerCase()] ?? "mdi:form-textbox";
}
