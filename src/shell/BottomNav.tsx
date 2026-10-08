import { useState } from "react"
import { Link, useLocation } from "react-router"
import { MoreHorizontal } from "lucide-react"
import { cn } from "@/lib/utils"
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet"
import { mobileOverflowItems, mobileTabItems } from "./nav-items"

/**
 * Primary mobile navigation. Fixed to the bottom so it stays reachable with a
 * thumb, with the home-indicator inset added as padding rather than margin so
 * the bar's background still runs to the bottom edge.
 */
export function BottomNav() {
    const location = useLocation()
    const [moreOpen, setMoreOpen] = useState(false)

    const isActive = (url: string) => location.pathname === url
    const overflowActive = mobileOverflowItems.some((item) => isActive(item.url))

    return (
        <>
            <nav
                className="fixed inset-x-0 bottom-0 z-40 border-t bg-background"
                style={{ paddingBottom: "var(--safe-area-bottom)" }}
            >
                <ul className="flex items-stretch">
                    {mobileTabItems.map((item) => (
                        <li key={item.url} className="flex-1">
                            <Link
                                to={item.url}
                                aria-current={isActive(item.url) ? "page" : undefined}
                                className={cn(
                                    // min-h-14 keeps every target comfortably past the 44px minimum
                                    "flex min-h-14 flex-col items-center justify-center gap-1 px-1 text-[11px]",
                                    isActive(item.url)
                                        ? "text-primary"
                                        : "text-muted-foreground"
                                )}
                            >
                                <item.icon className="size-5" />
                                <span className="max-w-full truncate">{item.title}</span>
                            </Link>
                        </li>
                    ))}

                    <li className="flex-1">
                        <button
                            type="button"
                            onClick={() => setMoreOpen(true)}
                            aria-haspopup="dialog"
                            aria-expanded={moreOpen}
                            className={cn(
                                "flex min-h-14 w-full flex-col items-center justify-center gap-1 px-1 text-[11px]",
                                overflowActive ? "text-primary" : "text-muted-foreground"
                            )}
                        >
                            <MoreHorizontal className="size-5" />
                            <span>Más</span>
                        </button>
                    </li>
                </ul>
            </nav>

            <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
                <SheetContent
                    side="bottom"
                    style={{ paddingBottom: "calc(1.5rem + var(--safe-area-bottom))" }}
                >
                    <SheetHeader>
                        <SheetTitle>Más</SheetTitle>
                    </SheetHeader>
                    <ul className="mt-2 flex flex-col">
                        {mobileOverflowItems.map((item) => (
                            <li key={item.url}>
                                <Link
                                    to={item.url}
                                    onClick={() => setMoreOpen(false)}
                                    className={cn(
                                        "flex min-h-12 items-center gap-3 rounded-md px-2",
                                        isActive(item.url)
                                            ? "text-primary"
                                            : "text-foreground"
                                    )}
                                >
                                    <item.icon className="size-5 shrink-0" />
                                    <span>{item.title}</span>
                                </Link>
                            </li>
                        ))}
                    </ul>
                </SheetContent>
            </Sheet>
        </>
    )
}
