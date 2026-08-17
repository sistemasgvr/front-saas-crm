export interface OrganizacionActual {
  id: string;
  nombre: string;
  slug: string;
  razonSocial: string | null;
  documentoFiscal: string | null;
  emailContacto: string | null;
  telefonoContacto: string | null;
  logoUrl: string | null;
  pais: string | null;
  zonaHoraria: string;
  fechaCreacion: string;
}
