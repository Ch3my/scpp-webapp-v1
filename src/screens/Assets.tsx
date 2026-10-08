import { useOptimistic, useState, type MouseEvent } from 'react';
import ScreenTitle from '@/components/ScreenTitle';

import AssetImgViewer from '@/components/AssetImgViewer';
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/responsive-dialog"
import { MoreHorizontal } from "lucide-react"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { toast } from 'sonner';
import { NewAsset } from '@/components/NewAsset';
import LoadingCircle from '@/components/LoadingCircle';
import { AssetListItem } from '@/models/Asset';
import { useAssets, useAsset, useDeleteAsset } from '@/api/hooks';

const Assets = () => {
    const [selectedAssetId, setSelectedAssetId] = useState<number | null>(null);
    const [assetToDelete, setAssetToDelete] = useState<AssetListItem | null>(null);

    const { data: assets = [], isLoading } = useAssets();

    // Cached per asset, so going back to one already viewed is instant.
    // isLoading, not isFetching: the latter is also true when a cached image is
    // revalidated in the background, which would swap the picture for a spinner.
    const { data: selectedAsset, isLoading: isLoadingAsset } = useAsset(selectedAssetId);
    const base64Img = selectedAsset?.assetData ?? "";

    // useOptimistic for immediate UI feedback on delete
    const [optimisticAssets, removeOptimisticAsset] = useOptimistic(
        assets,
        (currentAssets, deletedId: number) => currentAssets.filter(a => a.id !== deletedId)
    );

    const deleteMutation = useDeleteAsset();

    const handleRowClick = (id: number, e: MouseEvent) => {
        if ((e.target as HTMLElement).textContent === "Eliminar") {
            return;
        }
        setSelectedAssetId(id);
    };

    const confirmDelete = () => {
        if (!assetToDelete) return;

        setSelectedAssetId(null);
        removeOptimisticAsset(assetToDelete.id);
        deleteMutation.mutate(assetToDelete.id, {
            onSuccess: () => toast('Documento Eliminado'),
            onError: () => toast.error('Error al eliminar'),
        });
        setAssetToDelete(null);
    };

    return (
        <div className="grid gap-4 p-2 w-screen h-screen" style={{ gridTemplateColumns: "2fr 3fr" }} >
            <div>
                <ScreenTitle title='Assets' />
                <div>
                    <div className='px-1'>
                        {/* The create hook invalidates the assets list itself */}
                        <NewAsset />
                    </div>
                    <Table size='compact'>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-25">Fecha</TableHead>
                                <TableHead>Descripcion</TableHead>
                                <TableHead>Categoria</TableHead>
                                <TableHead></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center">Cargando...</TableCell>
                                </TableRow>
                            ) : (
                                optimisticAssets.map((asset) => (
                                    <TableRow key={asset.id} onClick={(e) => handleRowClick(asset.id, e)}>
                                        <TableCell>{asset.fecha}</TableCell>
                                        <TableCell>{asset.descripcion}</TableCell>
                                        <TableCell>{asset.categoria.descripcion}</TableCell>
                                        <TableCell>
                                            <DropdownMenu modal={false}>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" className="h-6 w-8 p-0">
                                                        <span className="sr-only">Open menu</span>
                                                        <MoreHorizontal />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => setAssetToDelete(asset)}>
                                                        Eliminar
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>
            {isLoadingAsset ? (
                <LoadingCircle />
            ) : base64Img ? (
                <AssetImgViewer base64Img={base64Img} />
            ) : (
                <div className="flex items-center justify-center h-full border-2 border-dashed border-muted-foreground/25 rounded-lg m-2">
                    <p className="text-muted-foreground text-sm">Selecciona un asset para ver</p>
                </div>
            )}
            <Dialog open={assetToDelete !== null} onOpenChange={(open) => !open && setAssetToDelete(null)}>
                <DialogContent className="sm:max-w-106.25">
                    <DialogHeader>
                        <DialogTitle>Eliminar Asset?</DialogTitle>
                        <DialogDescription>
                            Esta accion no se puede deshacer
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button onClick={confirmDelete} variant="destructive">Eliminar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default Assets;