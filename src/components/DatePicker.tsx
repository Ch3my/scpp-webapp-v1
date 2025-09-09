import * as React from "react";
import { CalendarIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { DateTime } from "luxon";
import { useEffect } from "react";

interface DatePickerProps {
    value?: DateTime | undefined;
    onChange: (date: DateTime | undefined) => void;
    disabled?: boolean;
}

export const DatePicker: React.FC<DatePickerProps & { className?: string }> = ({ value, onChange, className, disabled  }) => {
    const [selectedDate, setSelectedDate] = React.useState<DateTime | undefined>(value);

    useEffect(() => {
        setSelectedDate(value);
    }, [value]);

    // Handle Luxon `DateTime` conversion to `Date` and vice versa
    const handleSelect = (date: Date | undefined) => {
        const luxonDate = date ? DateTime.fromJSDate(date) : undefined;
        setSelectedDate(luxonDate);
        onChange(luxonDate);
    };

    return (
        <Popover modal>
            <PopoverTrigger asChild>
                <span>
                    <Button
                        variant={"outline"}
                        disabled={disabled}
                        className={cn(
                            "w-full justify-start text-left font-normal",
                            !selectedDate && "text-muted-foreground",
                            className
                        )}
                    >
                        <CalendarIcon />
                        {selectedDate ? selectedDate.toFormat("DDD") : <span>Elige una Fecha</span>}
                    </Button>
                </span>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
                <Calendar
                    mode="single"
                    selected={selectedDate?.toJSDate()}
                    onSelect={handleSelect}
                />
            </PopoverContent>
        </Popover>
    );
};
