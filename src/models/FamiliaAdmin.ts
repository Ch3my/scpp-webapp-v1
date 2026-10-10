import type { components } from "@/api/schema";

/** A family as the platform super-admin sees it: counts and admins, no finances. */
export type FamiliaAdmin = components["schemas"]["FamiliaAdmin"];
export type CreateFamilia = components["schemas"]["CreateFamilia"];
export type UpdateFamilia = components["schemas"]["UpdateFamilia"];
