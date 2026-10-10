import type { components } from "@/api/schema";

/**
 * A person in the family: who a gasto can belong to. Label-only miembros (kids,
 * say) have `tieneLogin: false` and no `rol`.
 */
export type Miembro = components["schemas"]["Miembro"];
export type CreateMiembro = components["schemas"]["CreateMiembro"];
export type UpdateMiembro = components["schemas"]["UpdateMiembro"];
export type GrantAcceso = components["schemas"]["GrantAcceso"];
export type UpdateAcceso = components["schemas"]["UpdateAcceso"];
