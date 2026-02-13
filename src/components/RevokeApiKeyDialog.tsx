import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import { ApiKey } from "@/models/ApiKey";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import api from "@/lib/api";

interface Props {
    apiKey: ApiKey | null;
    onClose: () => void;
}

export default function RevokeApiKeyDialog({ apiKey, onClose }: Props) {
    const queryClient = useQueryClient();

    const mutation = useMutation({
        mutationFn: async (id: number) => {
            await api.post(`/api-keys/${id}/revoke`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['api-keys'] });
            toast("API key revoked");
            onClose();
        },
        onError: () => {
            toast.error("Failed to revoke API key");
        }
    });

    const handleRevoke = () => {
        if (apiKey) {
            mutation.mutate(apiKey.id);
        }
    };

    return (
        <Dialog open={apiKey !== null} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Revoke API Key</DialogTitle>
                    <DialogDescription>
                        Are you sure you want to revoke "{apiKey?.name}"?
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                    <p className="text-sm text-muted-foreground">
                        This action is <strong>irreversible</strong>. Once revoked, this API key
                        will no longer be able to authenticate requests. Any integrations using
                        this key will stop working.
                    </p>
                </div>
                <DialogFooter className="gap-2">
                    <Button variant="outline" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={handleRevoke}
                        disabled={mutation.isPending}
                    >
                        {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Revoke
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
