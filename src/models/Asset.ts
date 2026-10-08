import type { components } from "@/api/schema";

/**
 * Generated from the backend OpenAPI spec. Refresh with `npm run gen:api`.
 *
 * `assetData` is a base64 data URL and is only populated when a single asset
 * is requested by id (`GET /assets?id[]=...`); the list response leaves it empty.
 */
export type Asset = components["schemas"]["Asset"];

export type CreateAsset = components["schemas"]["CreateAsset"];
