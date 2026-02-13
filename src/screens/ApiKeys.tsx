import { useState } from 'react';
import ScreenTitle from '@/components/ScreenTitle';
import { CreateApiKeyDialog } from '@/components/CreateApiKeyDialog';
import RevokeApiKeyDialog from '@/components/RevokeApiKeyDialog';
import DeleteApiKeyDialog from '@/components/DeleteApiKeyDialog';
import { useQuery } from '@tanstack/react-query';
import { ApiKey, ApiKeysListResponse } from '@/models/ApiKey';
import api from '@/lib/api';
import {
    flexRender,
    getCoreRowModel,
    useReactTable,
} from "@tanstack/react-table";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { columns } from "@/table-columns-def/api-keys-columns";
import { Skeleton } from '@/components/ui/skeleton';
import { KeyRound } from 'lucide-react';

const ApiKeys = () => {
    const [keyToRevoke, setKeyToRevoke] = useState<ApiKey | null>(null);
    const [keyToDelete, setKeyToDelete] = useState<ApiKey | null>(null);

    const { data: apiKeys = [], isLoading } = useQuery<ApiKey[]>({
        queryKey: ['api-keys'],
        queryFn: async () => {
            const { data } = await api.get<ApiKeysListResponse>("/api-keys");
            return data.apiKeys;
        }
    });

    const table = useReactTable({
        data: apiKeys,
        columns,
        getCoreRowModel: getCoreRowModel(),
        meta: {
            revokeApiKey: (key: ApiKey) => setKeyToRevoke(key),
            deleteApiKey: (key: ApiKey) => setKeyToDelete(key),
        }
    });

    return (
        <div className="p-4 w-screen h-screen overflow-auto">
            <ScreenTitle title="API Keys" />

            <div className="flex justify-between items-center mb-4 mt-4">
                <p className="text-muted-foreground text-sm">
                    Manage API keys for external access to your data.
                </p>
                <CreateApiKeyDialog />
            </div>

            <div className="border rounded-lg">
                <Table>
                    <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header) => (
                                    <TableHead key={header.id}>
                                        {header.isPlaceholder
                                            ? null
                                            : flexRender(
                                                header.column.columnDef.header,
                                                header.getContext()
                                            )}
                                    </TableHead>
                                ))}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            Array.from({ length: 3 }).map((_, index) => (
                                <TableRow key={index}>
                                    <TableCell colSpan={columns.length}>
                                        <Skeleton className="h-8 w-full" />
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : table.getRowModel().rows?.length ? (
                            table.getRowModel().rows.map((row) => (
                                <TableRow key={row.id}>
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell key={cell.id}>
                                            {flexRender(
                                                cell.column.columnDef.cell,
                                                cell.getContext()
                                            )}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={columns.length} className="h-32">
                                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                                        <KeyRound className="h-8 w-8 mb-2 opacity-50" />
                                        <p>No API keys yet</p>
                                        <p className="text-sm">Create your first API key to get started</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

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
};

export default ApiKeys;
