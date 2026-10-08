import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/responsive-dialog";
import { Loader2 } from "lucide-react";
import { ApiKey } from "@/models/ApiKey";
import { toast } from "sonner";
import { useRevokeApiKey } from "@/api/hooks";

interface Props {
    apiKey: ApiKey | null;
    onClose: () => void;
}

export default function RevokeApiKeyDialog({ apiKey, onClose }: Props) {
    const mutation = useRevokeApiKey();

    const handleRevoke = () => {
        if (!apiKey) return;
        mutation.mutate(apiKey.id, {
            onSuccess: () => {
                toast("API key revoked");
                onClose();
            },
            onError: () => toast.error("Failed to revoke API key"),
        });
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
