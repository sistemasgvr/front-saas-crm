export interface DynamicFilterOption {
  value: string;
  label: string;
}

export type DynamicFilterFieldType = "text" | "select" | "date" | "checkbox";

export interface DynamicFilterFieldDef {
  key: string;
  label: string;
  type: DynamicFilterFieldType;
  placeholder?: string;
  searchPlaceholder?: string;
  options?: DynamicFilterOption[];
  searchable?: boolean;
  disabled?: boolean;
}

export type DynamicFilterValues = Record<string, string>;

export function isActiveFilterValue(value: string | undefined) {
  return value !== undefined && value !== "";
}

export function countActiveFilters(values: DynamicFilterValues) {
  return Object.values(values).filter((value) => isActiveFilterValue(value)).length;
}
