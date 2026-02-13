import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { CirclePlus, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { DatePicker } from "./DatePicker";
import { DateTime } from "luxon";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { CreateApiKeyResponse } from "@/models/ApiKey";
import ApiKeyCreatedDialog from "./ApiKeyCreatedDialog";

export function CreateApiKeyDialog() {
    const queryClient = useQueryClient();
    const [isOpen, setIsOpen] = useState(false);

    const [name, setName] = useState("");
    const [rateLimit, setRateLimit] = useState<number>(1000);
    const [expiresAt, setExpiresAt] = useState<DateTime | undefined>(undefined);
    const [neverExpires, setNeverExpires] = useState(true);

    const [createdKey, setCreatedKey] = useState<CreateApiKeyResponse["apiKey"] | null>(null);

    const resetForm = () => {
        setName("");
        setRateLimit(1000);
        setExpiresAt(undefined);
        setNeverExpires(true);
    };

    useEffect(() => {
        if (!isOpen) {
            setTimeout(resetForm, 100);
        }
    }, [isOpen]);

    const mutation = useMutation({
        mutationFn: async () => {
            const payload = {
                name,
                rateLimit,
                expiresAt: neverExpires ? null : expiresAt?.toISO() ?? null,
            };
            const { data } = await api.post<CreateApiKeyResponse>("/api-keys", payload);
            if (!data.success) {
                throw new Error("Failed to create API key");
            }
            return data.apiKey;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['api-keys'] });
            setCreatedKey(data);
        },
        onError: () => {
            toast.error("Failed to create API key");
        }
    });

    const handleCreate = () => {
        if (!name.trim()) {
            toast("Name is required");
            return;
        }
        if (rateLimit < 10 || rateLimit > 10000) {
            toast("Rate limit must be between 10 and 10000");
            return;
        }
        mutation.mutate();
    };

    const handleKeyAcknowledged = () => {
        setCreatedKey(null);
        setIsOpen(false);
    };

    if (createdKey) {
        return (
            <ApiKeyCreatedDialog
                apiKey={createdKey}
                onClose={handleKeyAcknowledged}
            />
        );
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="outline">
                    <CirclePlus className="mr-2 h-4 w-4" />
                    Create API Key
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Create API Key</DialogTitle>
                    <DialogDescription>
                        Generate a new API key for external access.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="name" className="text-right">
                            Name
                        </Label>
                        <Input
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="My API Key"
                            className="col-span-3"
                            autoComplete="off"
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="rateLimit" className="text-right">
                            Rate Limit
                        </Label>
                        <Input
                            id="rateLimit"
                            type="number"
                            min={10}
                            max={10000}
                            value={rateLimit}
                            onChange={(e) => setRateLimit(Number(e.target.value))}
                            className="col-span-3"
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right">Expiration</Label>
                        <div className="col-span-3 space-y-2">
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="neverExpires"
                                    checked={neverExpires}
                                    onCheckedChange={(checked) => setNeverExpires(checked === true)}
                                />
                                <label htmlFor="neverExpires" className="text-sm">
                                    Never expires
                                </label>
                            </div>
                            {!neverExpires && (
                                <DatePicker
                                    value={expiresAt}
                                    onChange={(date) => setExpiresAt(date)}
                                />
                            )}
                        </div>
                    </div>
                </div>
                <DialogFooter>
                    <Button onClick={handleCreate} disabled={mutation.isPending}>
                        {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Create Key
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
