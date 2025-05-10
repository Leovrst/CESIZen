export interface PaginationOptions {
  /** numéro de page (1-based) */
  page?: number;
  /** nombre d’éléments par page */
  limit?: number;
}

export interface PaginatedResult<T> {
  /** éléments de la page courante */
  items: T[];
  /** nombre total d’éléments dans la base */
  total: number;
  /** page demandée */
  page: number;
  /** limite par page */
  limit: number;
}
