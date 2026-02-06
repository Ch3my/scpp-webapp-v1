import { useTransition, useOptimistic, useState, type MouseEvent } from 'react';
import ScreenTitle from '@/components/ScreenTitle';
import api from "@/lib/api";

import AssetImgViewer from '@/components/AssetImgViewer';
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
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
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Asset } from '@/models/Asset';

const Assets = () => {
    const queryClient = useQueryClient();
    const [base64Img, setBase64Img] = useState("");
    const [assetToDelete, setAssetToDelete] = useState<Asset | null>(null);

    // useTransition for image fetching
    const [isLoadingAsset, startAssetTransition] = useTransition();

    const { data: assets = [], isLoading } = useQuery<Asset[]>({
        queryKey: ['assets'],
        queryFn: async () => {
            const { data } = await api.get("/assets");
            return data;
        }
    });

    // useOptimistic for immediate UI feedback on delete
    const [optimisticAssets, removeOptimisticAsset] = useOptimistic(
        assets,
        (currentAssets, deletedId: number) => currentAssets.filter(a => a.id !== deletedId)
    );

    const deleteMutation = useMutation({
        mutationFn: async (id: number) => {
            await api.delete("/assets", { data: { id } });
        },
        onSuccess: () => {
            toast('Documento Eliminado');
            queryClient.invalidateQueries({ queryKey: ['assets'] });
        },
        onError: () => {
            toast.error('Error al eliminar');
            queryClient.invalidateQueries({ queryKey: ['assets'] });
        }
    });

    const handleRowClick = (id: number, e: MouseEvent) => {
        if ((e.target as HTMLElement).textContent === "Eliminar") {
            return;
        }

        startAssetTransition(async () => {
            const { data } = await api.get(`/assets?id[]=${id}`);
            setBase64Img(data[0].assetData);
        });
    };

    const confirmDelete = () => {
        if (!assetToDelete) return;

        setBase64Img("");
        removeOptimisticAsset(assetToDelete.id);
        deleteMutation.mutate(assetToDelete.id);
        setAssetToDelete(null);
    };

    return (
        <div className="grid gap-4 p-2 w-screen h-screen" style={{ gridTemplateColumns: "2fr 3fr" }} >
            <div>
                <ScreenTitle title='Assets' />
                <div>
                    <div className='px-1'>
                        <NewAsset onAssetSaved={() => queryClient.invalidateQueries({ queryKey: ['assets'] })} />
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