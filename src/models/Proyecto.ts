import type { components } from "@/api/schema";

/**
 * Generated from the backend OpenAPI spec. Refresh with `npm run gen:api`.
 *
 * Field notes the spec does not carry:
 * - `activo` is a reference-only status flag; it never restricts any action.
 * - `initialDate` / `finalDate` are 'yyyy-MM-dd', the earliest and latest
 *   `fecha` among linked gastos. Server-computed, read-only.
 */
export type Proyecto = components["schemas"]["Proyecto"];

/** `activo` defaults to true on the backend when omitted. */
export type CreateProyecto = components["schemas"]["CreateProyecto"];

/** PUT is a full replace, not a partial patch - `activo` is required. */
export type UpdateProyecto = components["schemas"]["UpdateProyecto"];
