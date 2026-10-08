import type { components } from "@/api/schema";

/** Generated from the backend OpenAPI spec. Refresh with `npm run gen:api`. */
export type ApiKey = components["schemas"]["ApiKeyResponse"];

export type CreateApiKeyPayload = components["schemas"]["CreateApiKeyRequest"];

/** The full `apiKey.key` is returned only once, at creation. */
export type CreateApiKeyResponse = components["schemas"]["CreateApiKeyResponse"];

export type ApiKeysListResponse = components["schemas"]["ListApiKeysResponse"];
export type ApiKeyActionResponse = components["schemas"]["SuccessResponse"];
