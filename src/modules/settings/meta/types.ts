export type MetaConnection =
  | { appConfigurada: false; conectado: false }
  | {
      appConfigurada: true;
      appId: string | null;
      conectado: boolean;
      id: string;
      metaUserNombre: string | null;
      pageId: string | null;
      pageNombre: string | null;
      adAccountId: string | null;
      adAccountNombre: string | null;
      tokenExpiraEn: string | null;
      fechaCreacion: string;
    };

export type MetaConnectionConfigured = Extract<MetaConnection, { appConfigurada: true }>;

export function isMetaConnectionConfigured(
  connection: MetaConnection | undefined,
): connection is MetaConnectionConfigured {
  return connection !== undefined && connection.appConfigurada;
}

export interface MetaOption {
  id: string;
  nombre: string;
}
