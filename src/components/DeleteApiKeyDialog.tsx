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
import { ApiKey } from "@/models/ApiKey";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import api from "@/lib/api";

interface Props {
    apiKey: ApiKey | null;
    onClose: () => void;
}

export default function DeleteApiKeyDialog({ apiKey, onClose }: Props) {
    const queryClient = useQueryClient();
    const isActive = apiKey?.isActive && !apiKey?.revokedAt;

    const mutation = useMutation({
        mutationFn: async (id: number) => {
            await api.delete(`/api-keys/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['api-keys'] });
            toast("API key deleted");
            onClose();
        },
        onError: () => {
            toast.error("Failed to delete API key");
        }
    });

    const handleDelete = () => {
        if (apiKey) {
            mutation.mutate(apiKey.id);
        }
    };

    return (
        <Dialog open={apiKey !== null} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Delete API Key</DialogTitle>
                    <DialogDescription>
                        Are you sure you want to delete "{apiKey?.name}"?
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-3">
                    {isActive && (
                        <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded">
                            <AlertTriangle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                            <p className="text-sm text-red-700 dark:text-red-400">
                                <strong>Warning:</strong> This API key is still active.
                                Deleting it will immediately revoke access for any systems using it.
                            </p>
                        </div>
                    )}
                    <p className="text-sm text-muted-foreground">
                        This action cannot be undone. The API key will be permanently removed.
                    </p>
                </div>
                <DialogFooter className="gap-2">
                    <Button variant="outline" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={handleDelete}
                        disabled={mutation.isPending}
                    >
                        {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Delete
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
