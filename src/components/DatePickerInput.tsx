import * as React from "react";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LazyCalendar } from "@/components/LazyCalendar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { DateTime } from "luxon";
const DISPLAY_FORMAT = "dd-MM-yyyy";

const format = (date: DateTime | undefined) => date?.toFormat(DISPLAY_FORMAT) ?? "";

// Tried in order against the input with its separators normalised to '-'. Day-first
// (Chilean convention); ddMMyyyy goes before yyyyMMdd so '15032026' is not year 1503.
// A format without a year gets the current one.
const FORMATS = [
    "d-M-yyyy", "d-M-yy", "yyyy-M-d", "d-M",
    "ddMMyyyy", "yyyyMMdd", "ddMMyy", "ddMM",
    "d-MMM-yyyy", "d-MMM-yy", "d-MMM", "dMMMyyyy", "dMMMyy",
    "d-MMMM-yyyy", "d-MMMM-yy", "d-MMMM",
    "MMM-d-yyyy", "MMMM-d-yyyy",
];

/** Any common way of typing a date: 15-03-2026, 15/3/26, 150326, 2026-03-15, 15 mar 2026, hoy… */
function parseFecha(input: string): DateTime | null {
    const text = input.trim().toLowerCase().replace(/[/.\s]+/g, "-");
    const today = DateTime.now().startOf("day");
    if (text === "hoy") return today;
    if (text === "mañana") return today.plus({ days: 1 });
    if (text === "ayer") return today.minus({ days: 1 });

    for (const fmt of FORMATS) {
        for (const locale of ["es", "en"]) {
            const dt = DateTime.fromFormat(text, fmt, { locale });
            // The range check stops '20120315' reading as 20-12-0315
            if (dt.isValid && dt.year >= 1900 && dt.year < 2100) return dt;
        }
    }
    return null;
}

/**
 * Inserts dashes as digits are typed: '15032026' -> '15-03-2026', '20260315' ->
 * '2026-03-15'. Leaves the text alone when it has letters, or when the user typed
 * their own short parts ('1-3-26').
 */
function maskFecha(raw: string): string {
    const text = raw.replace(/[/.\s]+/g, "-");
    if (!/^[\d-]*$/.test(text)) return raw;
    if (text.split("-").slice(0, -1).some((p) => p.length !== 2 && p.length !== 4)) return text;

    const digits = text.replace(/-/g, "").slice(0, 8);
    // Year-first only when it can't be day-first: in '2026…' the month would be 26
    const yearFirst = /^(19|20)/.test(digits) && Number(digits.slice(2, 4)) > 12;
    const sizes = yearFirst ? [4, 2, 2] : [2, 2, 4];

    let out = "";
    let pos = 0;
    sizes.forEach((size, i) => {
        const chunk = digits.slice(pos, pos + size);
        pos += size;
        out += chunk;
        // Trailing dash once a part is complete, so the next digit lands after it
        if (chunk.length === size && i < sizes.length - 1) out += "-";
    });
    return out;
}

interface DatePickerProps {
    value?: DateTime;
    onChange: (date: DateTime | undefined) => void;
    disabled?: boolean;
}

export const DatePickerInput: React.FC<
    DatePickerProps & { className?: string }
> = ({ value, onChange, className, disabled }) => {
    const [inputValue, setInputValue] = React.useState<string>(format(value));
    const [open, setOpen] = React.useState(false);
    // Last date this input reported, so echoing it back through `value` does not
    // overwrite what is still being typed ('15-03-2' while heading for 2026).
    const lastEmitted = React.useRef<string | null>(value?.toISODate() ?? null);

    // Sync external value changes
    React.useEffect(() => {
        const iso = value?.toISODate() ?? null;
        if (iso === lastEmitted.current) return;
        lastEmitted.current = iso;
        setInputValue(format(value));
    }, [value]);

    const emit = (date: DateTime | undefined) => {
        lastEmitted.current = date?.toISODate() ?? null;
        onChange(date);
    };

    // Calendar selection handler
    const handleSelect = (date: Date | undefined) => {
        const luxonDate = date ? DateTime.fromJSDate(date).startOf("day") : undefined;
        setInputValue(format(luxonDate));
        emit(luxonDate);
        setOpen(false);
    };

    // Manual input: accepts any format parseFecha knows, dashes inserted as you type.
    // Invalid or partial text reports undefined so a stale date is never saved.
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const raw = e.target.value;
        // Don't re-mask while deleting, or backspacing over a dash would re-add it
        const text = raw.length < inputValue.length ? raw : maskFecha(raw);
        setInputValue(text);
        emit(parseFecha(text) ?? undefined);
    };

    // Normalise whatever was typed to the canonical format once the user leaves
    const handleBlur = () => {
        const parsed = parseFecha(inputValue);
        if (parsed) setInputValue(format(parsed));
    };

    const invalid = inputValue.trim() !== "" && !parseFecha(inputValue);

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
                    onBlur={handleBlur}
                    onKeyDown={(e) => e.key === "Enter" && handleBlur()}
                    disabled={disabled}
                    inputMode="numeric"
                    autoComplete="off"
                    aria-invalid={invalid}
                    title="15-03-2026, 15/3/26, 150326, 2026-03-15, 15 mar 2026, hoy…"
                    placeholder="DD-MM-AAAA"
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
                <LazyCalendar
                    mode="single"
                    captionLayout="dropdown"
                    selected={value?.toJSDate()}
                    defaultMonth={value?.toJSDate()}
                    onSelect={handleSelect}
                />
            </PopoverContent>
        </Popover>
    );
};