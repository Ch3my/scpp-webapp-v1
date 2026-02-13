export type ApiKey = {
    id: number;
    keyPrefix: string;
    name: string;
    rateLimit: number;
    isActive: boolean;
    lastUsedAt: string | null;
    expiresAt: string | null;
    createdAt: string;
    revokedAt: string | null;
};

export type CreateApiKeyPayload = {
    name: string;
    rateLimit?: number;
    expiresAt?: string | null;
};

export type CreateApiKeyResponse = {
    success: true;
    successDescription: string[];
    apiKey: {
        id: number;
        key: string;
        keyPrefix: string;
        name: string;
        rateLimit: number;
        expiresAt: string | null;
        createdAt: string;
    };
};

export type ApiKeysListResponse = {
    success: true;
    apiKeys: ApiKey[];
};

export type ApiKeyActionResponse = {
    success: true;
    successDescription: string[];
};
