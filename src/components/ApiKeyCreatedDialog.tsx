import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { AlertTriangle, Copy, Check } from "lucide-react";
import { useState } from "react";
import { CreateApiKeyResponse } from "@/models/ApiKey";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";

interface Props {
    apiKey: CreateApiKeyResponse["apiKey"];
    onClose: () => void;
}

export default function ApiKeyCreatedDialog({ apiKey, onClose }: Props) {
    const [copied, setCopied] = useState(false);
    const [confirmed, setConfirmed] = useState(false);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(apiKey.key);
            setCopied(true);
            toast("Copied to clipboard");
            setTimeout(() => setCopied(false), 2000);
        } catch {
            toast.error("Failed to copy");
        }
    };

    const handleOpenChange = (open: boolean) => {
        if (!open && !confirmed) {
            toast("Please confirm you have saved the API key");
            return;
        }
        if (!open && confirmed) {
            onClose();
        }
    };

    return (
        <Dialog open={true} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-lg" showCloseButton={false}>
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-yellow-500" />
                        API Key Created
                    </DialogTitle>
                    <DialogDescription>
                        Make sure to copy your API key now. You will not be able to see it again.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="flex items-center gap-2">
                        <code className="flex-1 p-3 bg-muted rounded font-mono text-sm break-all">
                            {apiKey.key}
                        </code>
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={handleCopy}
                            className="shrink-0"
                        >
                            {copied ? (
                                <Check className="h-4 w-4 text-green-500" />
                            ) : (
                                <Copy className="h-4 w-4" />
                            )}
                        </Button>
                    </div>
                    <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded text-sm">
                        <p className="text-yellow-700 dark:text-yellow-400">
                            This key will only be shown once. Store it in a secure location.
                        </p>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="confirm-saved"
                            checked={confirmed}
                            onCheckedChange={(checked) => setConfirmed(checked === true)}
                        />
                        <label htmlFor="confirm-saved" className="text-sm">
                            I have saved my API key in a secure location
                        </label>
                    </div>
                </div>
                <DialogFooter>
                    <Button onClick={onClose} disabled={!confirmed}>
                        Done
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
