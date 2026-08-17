export type MetaConnection =
  | { conectado: false }
  | {
      conectado: true;
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
