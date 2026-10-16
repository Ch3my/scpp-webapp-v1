import { useLocation } from "react-router"
import { MoreHorizontal } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { useAppState } from "@/AppState"
import { cn } from "@/lib/utils"
import { findNavItem, mobileTabItems } from "./nav-items"
import { useLayoutMode } from "./useLayoutMode"

/**
 * Content placeholder for a mobile screen, shaped like the dashboard (tabs,
 * filter row, total card, rows) since that is where nearly every cold start
 * lands. Used by MobileShell while a lazy screen's chunk downloads.
 */
export function MobileScreenSkeleton() {
    return (
        <div className="flex flex-col gap-3 p-3" aria-busy="true">
            <Skeleton className="h-12 w-full rounded-lg" />
            <Skeleton className="h-11 w-full rounded-md" />
            <Skeleton className="h-28 w-full rounded-xl" />
            {Array.from({ length: 5 }).map((_, index) => (
                <Skeleton key={index} className="h-16 w-full rounded-lg" />
            ))}
        </div>
    )
}

/**
 * What a phone shows before the routes are allowed to render: while the
 * persisted cache is read from IndexedDB, while App.tsx decides where to go,
 * and while the first screen's chunk downloads.
 *
 * On mobile it draws MobileShell's own frame - same header, same bottom bar,
 * same tab highlighted - so the hand-over to the real shell changes nothing
 * but the content area. It used to be a spinner followed by a desktop-shaped
 * skeleton, i.e. two layout jumps before the first real frame.
 *
 * The bar is drawn, not mounted: navigating before the cache has landed would
 * race the restore, so nothing here is interactive.
 */
export function BootSkeleton() {
    const mode = useLayoutMode()
    const isLoggedIn = useAppState((state) => state.isLoggedIn)
    const { pathname } = useLocation()

    if (mode === "desktop") {
        return (
            <div className="flex items-center justify-center h-screen w-screen p-8">
                <div className="w-full max-w-4xl space-y-4">
                    <Skeleton className="h-12 w-3/4" />
                    <Skeleton className="h-64 w-full" />
                    <div className="space-y-2">
                        <Skeleton className="h-8 w-full" />
                        <Skeleton className="h-8 w-full" />
                        <Skeleton className="h-8 w-5/6" />
                    </div>
                </div>
            </div>
        )
    }

    // Heading to /login: a shell frame would be the wrong shape.
    if (!isLoggedIn && pathname !== "/") {
        return (
            <div className="fixed inset-0">
                <MobileScreenSkeleton />
            </div>
        )
    }

    // "/" is the boot route, which forwards to the dashboard
    const url = pathname === "/" ? "/dashboard" : pathname
    const current = findNavItem(url)

    return (
        <div className="fixed inset-0 flex flex-col">
            <header
                className="flex shrink-0 items-center justify-center gap-2 border-b bg-background px-4 py-3"
                style={{ paddingTop: "calc(0.75rem + var(--safe-area-top))" }}
            >
                <h1 className="truncate text-base font-semibold">
                    {current?.title ?? "SCPP"}
                </h1>
            </header>

            <main className="min-h-0 min-w-0 flex-1 overflow-hidden">
                <MobileScreenSkeleton />
            </main>

            <nav
                className="shrink-0 border-t bg-background"
                style={{ paddingBottom: "var(--safe-area-bottom)" }}
                aria-hidden="true"
            >
                <ul className="flex items-stretch">
                    {[...mobileTabItems, { url: "", title: "Más", icon: MoreHorizontal }].map((item) => (
                        <li key={item.title} className="flex-1">
                            <span
                                className={cn(
                                    "flex min-h-14 flex-col items-center justify-center gap-1 px-1 text-xs",
                                    item.url === url ? "text-primary" : "text-muted-foreground"
                                )}
                            >
                                <item.icon className="size-5" />
                                <span className="max-w-full truncate">{item.title}</span>
                            </span>
                        </li>
                    ))}
                </ul>
            </nav>
        </div>
    )
}
