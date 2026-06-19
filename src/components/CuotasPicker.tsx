import React, { useRef, useEffect, useCallback, useState } from 'react';

const ITEMS = [
    { label: 'Sin Cuotas', value: 0 },
    ...Array.from({ length: 11 }, (_, i) => ({ label: `${i + 2} Cuotas`, value: i + 2 })),
];

const ITEM_H = 40;
const VISIBLE = 3;
const CONTAINER_H = ITEM_H * VISIBLE;

interface CuotasPickerProps {
    value: number;
    onChange: (value: number) => void;
}

export const CuotasPicker: React.FC<CuotasPickerProps> = ({ value, onChange }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const dragRef = useRef<{ startY: number; startScrollTop: number } | null>(null);
    const [liveIndex, setLiveIndex] = useState(() => ITEMS.findIndex(i => i.value === value));
    const [isDragging, setIsDragging] = useState(false);

    const scrollToIndex = useCallback((index: number, smooth = true) => {
        containerRef.current?.scrollTo({
            top: index * ITEM_H,
            behavior: smooth ? 'smooth' : 'instant',
        });
    }, []);

    useEffect(() => {
        const index = ITEMS.findIndex(i => i.value === value);
        if (index !== -1) {
            setLiveIndex(index);
            scrollToIndex(index, false);
        }
    }, [value, scrollToIndex]);

    const commitScroll = useCallback(() => {
        if (!containerRef.current) return;
        const final = Math.max(0, Math.min(Math.round(containerRef.current.scrollTop / ITEM_H), ITEMS.length - 1));
        scrollToIndex(final);
        onChange(ITEMS[final].value);
    }, [onChange, scrollToIndex]);

    const handleScroll = () => {
        if (!containerRef.current) return;
        const snapped = Math.max(0, Math.min(Math.round(containerRef.current.scrollTop / ITEM_H), ITEMS.length - 1));
        setLiveIndex(snapped);

        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(commitScroll, 80);
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        if (!containerRef.current) return;
        e.preventDefault();
        dragRef.current = { startY: e.clientY, startScrollTop: containerRef.current.scrollTop };
        setIsDragging(true);
    };

    useEffect(() => {
        const onMouseMove = (e: MouseEvent) => {
            if (!dragRef.current || !containerRef.current) return;
            const delta = dragRef.current.startY - e.clientY;
            containerRef.current.scrollTop = dragRef.current.startScrollTop + delta;
        };

        const onMouseUp = () => {
            if (!dragRef.current) return;
            dragRef.current = null;
            setIsDragging(false);
            if (debounceRef.current) clearTimeout(debounceRef.current);
            commitScroll();
        };

        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);
        return () => {
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', onMouseUp);
        };
    }, [commitScroll]);

    return (
        <div className="relative rounded-md border overflow-hidden" style={{ height: CONTAINER_H }}>
            {/* fade top */}
            <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-10 bg-linear-to-b from-background to-transparent" />
            {/* fade bottom */}
            <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-10 bg-linear-to-t from-background to-transparent" />
            {/* center highlight bar */}
            <div
                className="pointer-events-none absolute inset-x-0 z-0 bg-muted rounded-sm mx-1"
                style={{ top: ITEM_H, height: ITEM_H }}
            />
            <div
                ref={containerRef}
                className="h-full overflow-y-scroll scrollbar-none [&::-webkit-scrollbar]:hidden"
                style={{
                    scrollSnapType: isDragging ? 'none' : 'y mandatory',
                    cursor: isDragging ? 'grabbing' : 'grab',
                }}
                onScroll={handleScroll}
                onMouseDown={handleMouseDown}
            >
                {/* top spacer so first item can center */}
                <div style={{ height: ITEM_H, flexShrink: 0 }} />
                {ITEMS.map((item, index) => {
                    const dist = Math.abs(index - liveIndex);
                    return (
                        <div
                            key={item.value}
                            className="flex items-center justify-center select-none transition-all duration-100"
                            style={{
                                height: ITEM_H,
                                scrollSnapAlign: 'center',
                                opacity: dist === 0 ? 1 : dist === 1 ? 0.5 : 0.2,
                                fontWeight: dist === 0 ? 600 : 400,
                                fontSize: dist === 0 ? '0.95rem' : '0.85rem',
                            }}
                            onClick={() => {
                                if (!isDragging) {
                                    scrollToIndex(index);
                                    onChange(item.value);
                                }
                            }}
                        >
                            {item.label}
                        </div>
                    );
                })}
                {/* bottom spacer */}
                <div style={{ height: ITEM_H, flexShrink: 0 }} />
            </div>
        </div>
    );
};
