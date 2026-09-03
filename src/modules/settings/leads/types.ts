export interface LeadAutoAsignacionConfig {
  habilitado: boolean;
  /**
   * Back nuevo: lista completa de usuarios del round-robin.
   */
  usuarioIds?: string[] | null;

  /**
   * Back legacy: dos usuarios (round-robin 2).
   * Se mantiene opcional para compatibilidad mientras migramos.
   */
  usuarioPrimeroId?: string | null;
  usuarioSegundoId?: string | null;

  /**
   * Índice del siguiente usuario a tocar en el round-robin.
   * (Con N usuarios ya no está limitado a 0|1).
   */
  siguienteIndice: number;
}

