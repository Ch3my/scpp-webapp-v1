import { useOptimistic } from 'react';
import { useSearchParams } from 'react-router';
import { ArrowLeft, MoreHorizontal, Trash } from 'lucide-react';
import { toast } from 'sonner';
import { Asset } from '@/models/Asset';
import { useAssets, useAsset, useDeleteAsset } from '@/api/hooks';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { NewAsset } from '@/components/NewAsset';
import AssetImgViewer from '@/components/AssetImgViewer';
import {
    DataCardHeader,
    DataCardMeta,
    DataCardList,
} from '@/components/mobile/DataCardList';

/**
 * List, then the image. Selection lives in the URL (`?id=`) rather than state
 * so the hardware back button and iOS edge-swipe close the image, instead of
 * leaving the screen entirely.
 */
const MobileAssets = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const selectedId = Number(searchParams.get('id')) || null;

    const { data: assets = [], isLoading } = useAssets();
    const { data: selectedAsset, isLoading: isLoadingAsset } = useAsset(selectedId);
    const deleteMutation = useDeleteAsset();

    const [optimisticAssets, removeOptimisticAsset] = useOptimistic(
        assets,
        (current, deletedId: number) => current.filter((a) => a.id !== deletedId)
    );

    const open = (asset: Asset) => {
        setSearchParams({ id: String(asset.id) });
    };

    const close = () => {
        // replace: false so this is a real history entry to go back from
        setSearchParams({});
    };

    const remove = (asset: Asset) => {
        if (selectedId === asset.id) close();
        removeOptimisticAsset(asset.id);
        deleteMutation.mutate(asset.id, {
            onSuccess: () => toast('Documento Eliminado'),
            onError: () => toast.error('Error al eliminar'),
        });
    };

    if (selectedId !== null) {
        return (
            <div className="flex h-full flex-col">
                <div className="flex items-center gap-2 p-2">
                    <Button variant="ghost" onClick={close} className="min-h-11">
                        <ArrowLeft className="mr-1 size-4" />
                        Volver
                    </Button>
                </div>

                {isLoadingAsset ? (
                    <Skeleton className="mx-3 h-80 rounded-lg" />
                ) : selectedAsset?.assetData ? (
                    <>
                        {/*
                          * AssetImgViewer owns pinch, drag and double-tap from
                          * pointer events, so the browser stays out of it. It is
                          * sized by the flex row rather than by its content -
                          * min-h-0 lets it shrink, and nothing inside scrolls, so
                          * the shell keeps its single scroll container.
                          */}
                        <div className="min-h-0 flex-1 px-3">
                            <AssetImgViewer base64Img={selectedAsset.assetData} />
                        </div>
                        <div className="p-3">
                            <p className="font-medium">{selectedAsset.descripcion}</p>
                            <p className="text-muted-foreground text-sm">
                                {selectedAsset.fecha} · {selectedAsset.categoria.descripcion}
                            </p>
                        </div>
                    </>
                ) : (
                    <p className="text-muted-foreground p-6 text-center text-sm">
                        No se pudo cargar la imagen
                    </p>
                )}
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-3 p-3">
            <div>
                <NewAsset />
            </div>

            <DataCardList
                items={optimisticAssets}
                isLoading={isLoading}
                getKey={(asset) => asset.id}
                emptyMessage="Sin assets"
                onItemClick={open}
                action={(asset) => (
                    <DropdownMenu modal={false}>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                className="size-9 p-0"
                                aria-label={`Acciones para ${asset.descripcion}`}
                            >
                                <MoreHorizontal />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => remove(asset)}>
                                <Trash className="mr-2 size-4" />
                                Eliminar
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                )}
                renderCard={(asset) => (
                    <>
                        <DataCardHeader title={asset.descripcion} />
                        <DataCardMeta>
                            <span>{asset.fecha}</span>
                            <span>{asset.categoria.descripcion}</span>
                        </DataCardMeta>
                    </>
                )}
            />
        </div>
    );
};

export default MobileAssets;
