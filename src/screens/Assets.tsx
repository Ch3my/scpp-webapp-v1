import React from 'react';
import { useAppState } from "@/AppState"
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

export type Asset = {
    id: number
    fecha: string
    descripcion: string
    categoria: {
        descripcion: string
    }
}

const Assets: React.FC = () => {
    const { apiPrefix, sessionId } = useAppState()
    const [assets, setAssets] = React.useState<Asset[]>([]);
    const [base64Img, setBase64Img] = React.useState<string>("");
    const [loading, setLoading] = React.useState<boolean>(false);
    const [loadingAsset, setLoadingAsset] = React.useState<boolean>(false);
    const [assetIdToBeDeleted, setAssetIdToBeDeleted] = React.useState<number>(0);
    const [showDeleteConfirm, setShowDeleteConfirm] = React.useState<boolean>(false);

    const getData = async () => {
        setLoading(true);
        let params = new URLSearchParams();
        params.set("sessionHash", sessionId);
        let data = await fetch(`${apiPrefix}/assets?${params.toString()}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        }).then(response => response.json())
        setAssets(data);
        setLoading(false);
    }

    const handleRowClick = async (id: number, e: any) => {
        // Los elementos de las htas igual trigger este evento, por lo que se debe filtrar
        if (e.target.textContent === "Eliminar") {
            return;
        }
        setLoadingAsset(true)

        let params = new URLSearchParams();
        params.set("sessionHash", sessionId);
        params.set("id[]", String(id));
        let data = await fetch(`${apiPrefix}/assets?${params.toString()}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        }).then(response => response.json())
        setBase64Img(data[0].assetData);
        setLoadingAsset(false)
    }

    const deleteAsset = async (confirmed?: boolean) => {
        if (!confirmed) {
            setShowDeleteConfirm(true)
            return
        }
        setShowDeleteConfirm(false)
        setBase64Img("");
        await fetch(`${apiPrefix}/assets`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ sessionHash: sessionId, id: assetIdToBeDeleted }),

        }).then(response => response.json())
        toast('Documento Eliminado')
        getData()
    }

    React.useEffect(() => {
        getData()
    }, []);

    return (
        <div className="grid gap-4 p-2 w-screen h-screen" style={{ gridTemplateColumns: "2fr 3fr" }} >
            <div>
                <ScreenTitle title='Assets' />
                <div>
                    <div className='px-1'>
                        <NewAsset onAssetSaved={() => getData()} />
                    </div>
                    <Table size='compact'>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[100px]">Fecha</TableHead>
                                <TableHead>Descripcion</TableHead>
                                <TableHead>Categoria</TableHead>
                                <TableHead></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center">Cargando...</TableCell>
                                </TableRow>
                            ) : (
                                assets.map((asset, index) => (
                                    <TableRow key={index} onClick={(e) => handleRowClick(asset.id, e)}>
                                        <TableCell>{asset.fecha}</TableCell>
                                        <TableCell>{asset.descripcion}</TableCell>
                                        <TableCell>{asset.categoria.descripcion}</TableCell>
                                        <TableCell>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" className="h-6 w-8 p-0">
                                                        <span className="sr-only">Open menu</span>
                                                        <MoreHorizontal />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem
                                                        onClick={() => {
                                                            setAssetIdToBeDeleted(asset.id)
                                                            deleteAsset()
                                                        }}
                                                    >
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
            {loadingAsset ?
                <LoadingCircle /> :
                <AssetImgViewer base64Img={base64Img} />
            }
            <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Eliminar Asset?</DialogTitle>
                        <DialogDescription>
                            Esta accion no se puede deshacer
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button onClick={() => deleteAsset(true)} variant="destructive">Eliminar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default Assets;