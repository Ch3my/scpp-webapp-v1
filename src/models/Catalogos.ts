import type { components } from "@/api/schema";

/**
 * Lookup tables behind the categoria / tipoDoc selectors. Both were `any[]`
 * in the app store before the OpenAPI types existed.
 */
export type Categoria = components["schemas"]["Categoria"];
export type TipoDoc = components["schemas"]["TipoDoc"];
