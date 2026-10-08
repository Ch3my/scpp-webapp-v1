import { useState } from 'react';
import { KeyRound, MoreHorizontal, Ban, Trash } from 'lucide-react';
import { ApiKey } from '@/models/ApiKey';
import { useApiKeys } from '@/api/hooks';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { CreateApiKeyDialog } from '@/components/CreateApiKeyDialog';
import RevokeApiKeyDialog from '@/components/RevokeApiKeyDialog';
import DeleteApiKeyDialog from '@/components/DeleteApiKeyDialog';
import {
    DataCardHeader,
    DataCardMeta,
    DataCardList,
} from '@/components/mobile/DataCardList';
import {
    ApiKeyStatusBadge,
    getApiKeyStatus,
} from '@/table-columns-def/api-keys-columns';
import { formatDate, formatRelativeTime } from '@/lib/relative-time';

const MobileApiKeys = () => {
    const [keyToRevoke, setKeyToRevoke] = useState<ApiKey | null>(null);
    const [keyToDelete, setKeyToDelete] = useState<ApiKey | null>(null);

    const { data: apiKeys = [], isLoading } = useApiKeys();

    return (
        <div className="flex flex-col gap-3 p-3">
            <div className="flex items-center justify-between gap-2">
                <p className="text-muted-foreground text-sm">
                    Acceso externo a tus datos.
                </p>
                <CreateApiKeyDialog />
            </div>

            {!isLoading && apiKeys.length === 0 ? (
                <div className="text-muted-foreground flex flex-col items-center justify-center py-12">
                    <KeyRound className="mb-2 size-8 opacity-50" />
                    <p>No API keys yet</p>
                    <p className="text-sm">Create your first API key to get started</p>
                </div>
            ) : (
                <DataCardList
                    items={apiKeys}
                    isLoading={isLoading}
                    skeletonCount={3}
                    getKey={(key) => key.id}
                    action={(key) => <ApiKeyRowMenu apiKey={key} />}
                    renderCard={(key) => <ApiKeyCardBody apiKey={key} />}
                />
            )}

            <RevokeApiKeyDialog
                apiKey={keyToRevoke}
                onClose={() => setKeyToRevoke(null)}
            />
            <DeleteApiKeyDialog
                apiKey={keyToDelete}
                onClose={() => setKeyToDelete(null)}
            />
        </div>
    );

    /** Declared inside so the row menu can reach the dialog setters. */
    function ApiKeyRowMenu({ apiKey }: { apiKey: ApiKey }) {
        const status = getApiKeyStatus(apiKey);

        return (
            <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild>
                    <Button
                        variant="ghost"
                        className="size-9 p-0"
                        aria-label={`Acciones para ${apiKey.name}`}
                    >
                        <MoreHorizontal />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    {status === 'active' && (
                        <>
                            <DropdownMenuItem onClick={() => setKeyToRevoke(apiKey)}>
                                <Ban className="mr-2 size-4" />
                                Revoke
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                        </>
                    )}
                    <DropdownMenuItem onClick={() => setKeyToDelete(apiKey)}>
                        <Trash className="mr-2 size-4" />
                        Delete
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        );
    }

    function ApiKeyCardBody({ apiKey }: { apiKey: ApiKey }) {
        return (
            <>
                <DataCardHeader
                    title={apiKey.name}
                    trailing={<ApiKeyStatusBadge apiKey={apiKey} />}
                />
                <code className="bg-muted mt-1 inline-block rounded px-2 py-1 font-mono text-xs">
                    {apiKey.keyPrefix}...
                </code>
                <DataCardMeta>
                    <span>Usada {formatRelativeTime(apiKey.lastUsedAt)}</span>
                    <span>Creada {formatDate(apiKey.createdAt)}</span>
                    {apiKey.expiresAt && <span>Expira {formatDate(apiKey.expiresAt)}</span>}
                </DataCardMeta>
            </>
        );
    }
};

export default MobileApiKeys;
