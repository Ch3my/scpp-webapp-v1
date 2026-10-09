import type { components } from "@/api/schema";

/**
 * Wire shape of GET /documentos, generated from the backend OpenAPI spec.
 * Refresh with `npm run gen:api`.
 *
 * Note `categoria`, `proyecto` and `tipoDoc` are resolved objects the server
 * always sends on GET (nullable, not optional) - the previous hand-written
 * type marked them optional and omitted `fk_user` entirely.
 */
export type Documento = components["schemas"]["Documento"];

export type CreateDocumento = components["schemas"]["CreateDocumento"];
export type UpdateDocumento = components["schemas"]["UpdateDocumento"];
export type CategoriaSugerida = components["schemas"]["CategoriaSugerida"];
