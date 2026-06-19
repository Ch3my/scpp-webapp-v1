import React, { useRef, useEffect, useState, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const ITEMS = [
    { label: 'Sin Cuotas', value: 0 },
    ...Array.from({ length: 11 }, (_, i) => ({ label: `${i + 2} Cuotas`, value: i + 2 })),
];

// Horizontal pixels required to advance one step while dragging
const DRAG_PER_STEP = 40;

interface CuotasPickerProps {
    value: number;
    onChange: (value: number) => void;
}

export const CuotasPicker: React.FC<CuotasPickerProps> = ({ value, onChange }) => {
    const indexOf = (v: number) => Math.max(0, ITEMS.findIndex(i => i.value === v));
    const [displayIndex, setDisplayIndex] = useState(() => indexOf(value));

    // All mutable drag state lives in a ref — no stale closures
    const drag = useRef<{ startX: number; startIndex: number; currentIndex: number } | null>(null);
    const [isDragging, setIsDragging] = useState(false);

    useEffect(() => {
        if (!drag.current) setDisplayIndex(indexOf(value));
    }, [value]);

    const goTo = useCallback((index: number) => {
        const clamped = Math.max(0, Math.min(index, ITEMS.length - 1));
        setDisplayIndex(clamped);
        onChange(ITEMS[clamped].value);
    }, [onChange]);

    const containerRef = useRef<HTMLDivElement>(null);

    const wheelAccum = useRef(0);

    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;
        const onWheel = (e: WheelEvent) => {
            e.preventDefault();
            wheelAccum.current += e.deltaY;
            if (Math.abs(wheelAccum.current) < 80) return;
            const direction = wheelAccum.current > 0 ? 1 : -1;
            wheelAccum.current = 0;
            setDisplayIndex(prev => {
                const next = Math.max(0, Math.min(prev + direction, ITEMS.length - 1));
                onChange(ITEMS[next].value);
                return next;
            });
        };
        el.addEventListener('wheel', onWheel, { passive: false });
        return () => el.removeEventListener('wheel', onWheel);
    }, [onChange]);

    const handleMouseDown = (e: React.MouseEvent) => {
        e.preventDefault();
        drag.current = { startX: e.clientX, startIndex: displayIndex, currentIndex: displayIndex };
        setIsDragging(true);
    };

    useEffect(() => {
        const onMove = (e: MouseEvent) => {
            if (!drag.current) return;
            // drag left → higher index (next), drag right → lower index (prev)
            const steps = Math.round((drag.current.startX - e.clientX) / DRAG_PER_STEP);
            const next = Math.max(0, Math.min(drag.current.startIndex + steps, ITEMS.length - 1));
            drag.current.currentIndex = next;
            setDisplayIndex(next);
        };

        const onUp = () => {
            if (!drag.current) return;
            onChange(ITEMS[drag.current.currentIndex].value);
            drag.current = null;
            setIsDragging(false);
        };

        window.addEventListener('mousemove', onMove);
        window.addEventListener('mouseup', onUp);
        return () => {
            window.removeEventListener('mousemove', onMove);
            window.removeEventListener('mouseup', onUp);
        };
    }, [onChange]);

    return (
        <div
            ref={containerRef}
            className="flex items-center h-10 border rounded-md overflow-hidden select-none"
            style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
            onMouseDown={handleMouseDown}
        >
            <button
                type="button"
                className="h-full px-2 flex items-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-30"
                onMouseDown={(e) => e.stopPropagation()}
                onClick={() => goTo(displayIndex - 1)}
                disabled={displayIndex === 0}
            >
                <ChevronLeft className="h-4 w-4" />
            </button>
            <div className="flex-1 text-center text-sm font-medium">
                {ITEMS[displayIndex]?.label}
            </div>
            <button
                type="button"
                className="h-full px-2 flex items-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-30"
                onMouseDown={(e) => e.stopPropagation()}
                onClick={() => goTo(displayIndex + 1)}
                disabled={displayIndex === ITEMS.length - 1}
            >
                <ChevronRight className="h-4 w-4" />
            </button>
        </div>
    );
};
