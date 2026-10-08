import type { Key, ReactNode } from "react"
import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"

/**
 * The mobile stand-in for a table. Tables do not reflow at phone width - they
 * scroll sideways - so rows become stacked cards instead.
 *
 * This owns only the list chrome (loading, empty, spacing). Each entity
 * supplies its own card body, kept next to that entity's column definitions so
 * the two stay discoverable together.
 */
interface DataCardListProps<T> {
    items: readonly T[]
    getKey: (item: T) => Key
    renderCard: (item: T) => ReactNode
    isLoading?: boolean
    emptyMessage?: string
    skeletonCount?: number
    onItemClick?: (item: T) => void
    /** Tighter padding and spacing, for dense lists like the gastos feed. */
    compact?: boolean
    /**
     * Trailing control (a row menu, a button). Rendered as a SIBLING of the
     * tappable region, never inside it - nesting a button in a button is
     * invalid HTML and makes the inner tap ambiguous.
     */
    action?: (item: T) => ReactNode
    className?: string
}

export function DataCardList<T>({
    items,
    getKey,
    renderCard,
    isLoading = false,
    emptyMessage = "Sin datos",
    skeletonCount = 5,
    onItemClick,
    action,
    compact = false,
    className,
}: DataCardListProps<T>) {
    if (isLoading) {
        return (
            <div className={cn("flex flex-col gap-2", className)}>
                {Array.from({ length: skeletonCount }).map((_, index) => (
                    <Skeleton key={index} className="h-20 w-full rounded-lg" />
                ))}
            </div>
        )
    }

    if (items.length === 0) {
        return (
            <p className={cn("text-muted-foreground px-1 py-8 text-center text-sm", className)}>
                {emptyMessage}
            </p>
        )
    }

    return (
        <ul className={cn("flex flex-col", compact ? "gap-1.5" : "gap-2", className)}>
            {items.map((item) => (
                <li key={getKey(item)}>
                    <DataCard
                        onClick={onItemClick ? () => onItemClick(item) : undefined}
                        action={action?.(item)}
                        compact={compact}
                    >
                        {renderCard(item)}
                    </DataCard>
                </li>
            ))}
        </ul>
    )
}

/**
 * A single tappable card. Rendered as a button only when it does something, so
 * non-interactive lists stay out of the tab order.
 */
export function DataCard({
    onClick,
    action,
    compact = false,
    children,
    className,
}: {
    onClick?: () => void
    action?: ReactNode
    compact?: boolean
    children: ReactNode
    className?: string
}) {
    const body = onClick ? (
        // Still a comfortable target when compact: the row is two lines, so
        // 2.75rem clears the 44px minimum without the roomier default.
        <button
            type="button"
            onClick={onClick}
            // Marks the tappable region so the press highlight below can target
            // it alone, rather than any button inside the card.
            data-card-body=""
            className={cn("min-w-0 flex-1 text-left", compact ? "min-h-11" : "min-h-14")}
        >
            {children}
        </button>
    ) : (
        <div className="min-w-0 flex-1">{children}</div>
    )

    return (
        <div
            className={cn(
                "bg-card flex w-full items-start gap-2 rounded-lg border",
                compact ? "px-3 py-2" : "p-3",
                // Scoped to the body button: a bare has-[button:active] also
                // matched the row menu trigger, so opening the menu flashed the
                // whole card.
                onClick && "has-[[data-card-body]:active]:bg-accent",
                className
            )}
        >
            {body}
            {action != null && <div className="shrink-0">{action}</div>}
        </div>
    )
}

/** Title line of a card, with optional trailing content (an amount, a badge). */
export function DataCardHeader({
    title,
    trailing,
}: {
    title: ReactNode
    trailing?: ReactNode
}) {
    return (
        <div className="flex items-start justify-between gap-3">
            <span className="min-w-0 flex-1 truncate font-medium">{title}</span>
            {trailing != null && <span className="shrink-0 tabular-nums">{trailing}</span>}
        </div>
    )
}

/** Secondary metadata line under the header. */
export function DataCardMeta({ children }: { children: ReactNode }) {
    return (
        <div className="text-muted-foreground mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
            {children}
        </div>
    )
}
