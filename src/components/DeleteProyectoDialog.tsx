import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { AlertTriangle, Loader2 } from "lucide-react";
import { Proyecto } from "@/models/Proyecto";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import api from "@/lib/api";
import { getApiErrorMessage } from "@/lib/api-errors";

interface Props {
    proyecto: Proyecto | null;
    onClose: () => void;
    /** Lets the screen clear its selection deterministically */
    onDeleted: (id: number) => void;
}

export default function DeleteProyectoDialog({ proyecto, onClose, onDeleted }: Props) {
    const queryClient = useQueryClient();

    const mutation = useMutation({
        mutationFn: async (id: number) => {
            const { data } = await api.delete("/proyectos", { data: { id } });
            if (data?.hasErrors) {
                throw new Error(data.errorDescription[0]);
            }
            return id;
        },
        onSuccess: (deletedId: number) => {
            queryClient.invalidateQueries({ queryKey: ['proyectos'] });
            queryClient.invalidateQueries({ queryKey: ['proyectosCombobox'] });
            queryClient.invalidateQueries({ queryKey: ['proyectoDocs'] });
            // The resolved doc.proyecto / fk_proyecto of every linked gasto went stale
            queryClient.invalidateQueries({ queryKey: ['docs'] });
            queryClient.invalidateQueries({ queryKey: ['doc'] });
            onDeleted(deletedId);
            toast('Proyecto Eliminado');
            onClose();
        },
        onError: (error) => {
            toast.error('Error al eliminar el proyecto: ' + getApiErrorMessage(error));
        }
    });

    const handleDelete = () => {
        if (proyecto) {
            mutation.mutate(proyecto.id);
        }
    };

    return (
        <Dialog open={proyecto !== null} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Eliminar Proyecto</DialogTitle>
                    <DialogDescription>
                        ¿Seguro que quieres eliminar "{proyecto?.nombre}"?
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-3">
                    <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded">
                        <AlertTriangle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                        <p className="text-sm text-red-700 dark:text-red-400">
                            Los gastos asignados a este proyecto <strong>no se eliminan</strong>;
                            quedarán sin proyecto asignado.
                        </p>
                    </div>
                    <p className="text-sm text-muted-foreground">
                        Esta acción no se puede deshacer.
                    </p>
                </div>
                <DialogFooter className="gap-2">
                    <Button variant="outline" onClick={onClose}>
                        Cancelar
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={handleDelete}
                        disabled={mutation.isPending}
                    >
                        {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Eliminar
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
