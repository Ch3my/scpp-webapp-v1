import type { components } from "@/api/schema";

/**
 * Generated from the backend OpenAPI spec. Refresh with `npm run gen:api`.
 *
 * Two types on purpose, because there are two responses: `AssetListItem` is a
 * row from `GET /assets` and has no image, and `Asset` is `GET /assets/{id}`
 * with `assetData` (a base64 data URL). The list used to carry the image for
 * every row, which meant opening the screen downloaded the whole account.
 */
export type Asset = components["schemas"]["Asset"];

export type AssetListItem = components["schemas"]["AssetListItem"];

export type CreateAsset = components["schemas"]["CreateAsset"];
