import * as React from "react";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { DateTime } from "luxon";

interface DatePickerProps {
    value?: DateTime;
    onChange: (date: DateTime | undefined) => void;
    disabled?: boolean;
}

export const DatePickerInput: React.FC<
    DatePickerProps & { className?: string }
> = ({ value, onChange, className, disabled }) => {
    const [selectedDate, setSelectedDate] = React.useState<DateTime | undefined>(value);
    const [inputValue, setInputValue] = React.useState<string>(value?.toISODate() ?? "");
    const [open, setOpen] = React.useState(false);

    // Sync external value changes
    React.useEffect(() => {
        setSelectedDate(value);
        setInputValue(value?.toISODate() ?? "");
    }, [value]);

    // Calendar selection handler
    const handleSelect = (date: Date | undefined) => {
        if (date) {
            const luxonDate = DateTime.fromJSDate(date).startOf("day");
            setSelectedDate(luxonDate);
            setInputValue(luxonDate.toISODate() ?? "");
            onChange(luxonDate);
        } else {
            setSelectedDate(undefined);
            setInputValue("");
            onChange(undefined);
        }
        setOpen(false);
    };

    // Manual input handler: only call onChange when valid
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const raw = e.target.value;
        setInputValue(raw);

        // Only accept strict ISO date format: YYYY-MM-DD
        const isoDatePattern = /^\d{4}-\d{2}-\d{2}$/;
        if (!isoDatePattern.test(raw)) {
            return;
        }

        const parsed = DateTime.fromISO(raw);
        if (parsed.isValid) {
            const dt = parsed.startOf("day");
            setSelectedDate(dt);
            onChange(dt);
        }
    };

    // Handle open state changes, preventing opening if disabled
    const handleOpenChange = (newOpen: boolean) => {
        if (disabled && newOpen) {
            return; // Prevent opening if disabled
        }
        setOpen(newOpen);
    };

    return (
        <Popover open={open} onOpenChange={handleOpenChange} modal>
            {/* Input & calendar trigger */}
            <div className={cn("flex items-center space-x-2", className)}>
                <Input
                    value={inputValue}
                    onChange={handleInputChange}
                    disabled={disabled}
                    placeholder="YYYY-MM-DD"
                    className="flex-1"
                />
                <PopoverTrigger asChild disabled={disabled}>
                    <span>
                        <Button
                            type="button"
                            variant="outline"
                            disabled={disabled}
                            className="p-2"
                        >
                            <CalendarIcon className="h-4 w-4" />
                        </Button>
                    </span>
                </PopoverTrigger>
            </div>

            {/* Calendar popover */}
            <PopoverContent align="end" className="w-auto p-0">
                <Calendar
                    mode="single"
                    captionLayout="dropdown"
                    selected={selectedDate?.toJSDate()}
                    onSelect={handleSelect}
                />
            </PopoverContent>
        </Popover>
    );
};