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
import { useLayoutMode } from "@/shell/useLayoutMode";

interface DatePickerProps {
    value?: DateTime | undefined;
    onChange: (date: DateTime | undefined) => void;
    disabled?: boolean;
}

export const DatePicker: React.FC<DatePickerProps & { className?: string }> = ({ value, onChange, className, disabled  }) => {
    const isMobile = useLayoutMode() === "mobile";
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
            {/*
              * Desktop opens to the right of the trigger with a negative offset so
              * the calendar overlaps the field. On a phone the trigger is nearly
              * full width, so "right" puts the calendar half off-screen - there it
              * drops below instead, with collisionPadding keeping it inside the
              * viewport.
              */}
            <PopoverContent
                className="w-auto p-0"
                side={isMobile ? "bottom" : "right"}
                align="center"
                sideOffset={isMobile ? 4 : -40}
                collisionPadding={isMobile ? 8 : undefined}
            >
                <Calendar
                    mode="single"
                    selected={selectedDate?.toJSDate()}
                    onSelect={handleSelect}
                    captionLayout="dropdown"
                    // Bigger day cells on mobile: 1.8125rem is a 29px tap target
                    className={isMobile ? "p-2 [--cell-size:2.25rem]" : "p-2 [--cell-size:1.8125rem]"}
                />
            </PopoverContent>
        </Popover>
    );
};
