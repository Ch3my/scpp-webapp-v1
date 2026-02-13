import { ApiKey } from "@/models/ApiKey";
import { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, Trash, Ban } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { formatRelativeTime, formatDate } from "@/lib/relative-time";

type ApiKeyStatus = 'active' | 'revoked' | 'expired';

const statusConfig: Record<ApiKeyStatus, { label: string; className: string }> = {
    active: { label: 'Active', className: 'bg-green-500/15 text-green-700 border-green-500/20' },
    revoked: { label: 'Revoked', className: 'bg-red-500/15 text-red-700 border-red-500/20' },
    expired: { label: 'Expired', className: 'bg-yellow-500/15 text-yellow-700 border-yellow-500/20' },
};

function getStatus(key: ApiKey): ApiKeyStatus {
    if (key.revokedAt) return 'revoked';
    if (key.expiresAt && new Date(key.expiresAt) < new Date()) return 'expired';
    return key.isActive ? 'active' : 'revoked';
}

export const columns: ColumnDef<ApiKey>[] = [
    {
        accessorKey: "name",
        header: "Name",
    },
    {
        accessorKey: "keyPrefix",
        header: "Key",
        cell: ({ row }) => (
            <code className="font-mono text-sm bg-muted px-2 py-1 rounded">
                {row.original.keyPrefix}...
            </code>
        ),
    },
    {
        id: "status",
        header: "Status",
        cell: ({ row }) => {
            const status = getStatus(row.original);
            const config = statusConfig[status];
            return (
                <Badge variant="outline" className={config.className}>
                    {config.label}
                </Badge>
            );
        },
    },
    {
        accessorKey: "lastUsedAt",
        header: "Last Used",
        cell: ({ row }) => formatRelativeTime(row.original.lastUsedAt),
    },
    {
        accessorKey: "createdAt",
        header: "Created",
        cell: ({ row }) => formatDate(row.original.createdAt),
    },
    {
        accessorKey: "expiresAt",
        header: "Expires",
        cell: ({ row }) => formatDate(row.original.expiresAt),
    },
    {
        id: "actions",
        cell: ({ row, table }) => {
            const { revokeApiKey, deleteApiKey } = table.options.meta as {
                revokeApiKey: (key: ApiKey) => void;
                deleteApiKey: (key: ApiKey) => void;
            };
            const apiKey = row.original;
            const status = getStatus(apiKey);
            const isActive = status === 'active';

            return (
                <DropdownMenu modal={false}>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-6 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        {isActive && (
                            <>
                                <DropdownMenuItem onClick={() => revokeApiKey(apiKey)}>
                                    <Ban />
                                    Revoke
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                            </>
                        )}
                        <DropdownMenuItem
                            onClick={() => deleteApiKey(apiKey)}
                            className="text-destructive"
                        >
                            <Trash />
                            Delete
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            );
        },
    },
];
