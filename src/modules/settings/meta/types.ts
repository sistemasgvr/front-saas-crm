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

export interface MetaOption {
  id: string;
  nombre: string;
}
