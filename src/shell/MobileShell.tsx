import { Outlet, useLocation } from "react-router"
import { BottomNav } from "./BottomNav"
import { findNavItem } from "./nav-items"

/**
 * Phone layout: a sticky title bar, the screen, and a fixed bottom bar.
 *
 * AppSidebar is deliberately NOT mounted here - BottomNav is the whole of
 * mobile navigation. (Mounting it would also mean a forced-mobile preview on a
 * wide screen rendered the full desktop sidebar beside the bottom bar, since
 * the sidebar's own off-canvas behaviour keys off the real viewport.)
 *
 * Consequence until Phase 3: the SidebarTrigger that the desktop screens render
 * via ScreenTitle is inert in mobile mode. It toggles provider state with no
 * Sidebar listening, which is harmless; those screens get mobile counterparts
 * in Phase 3 and stop rendering ScreenTitle at all.
 */
export function MobileShell() {
    const location = useLocation()
    const current = findNavItem(location.pathname)

    return (
        <>
            <div className="flex min-h-dvh w-full min-w-0 flex-col">
                <header
                    className="sticky top-0 z-30 flex shrink-0 items-center gap-2 border-b bg-background px-4 py-3"
                    style={{ paddingTop: "calc(0.75rem + var(--safe-area-top))" }}
                >
                    <h1 className="truncate text-base font-semibold">
                        {current?.title ?? "SCPP"}
                    </h1>
                </header>

                {/*
                  * pb clears the fixed bottom bar: its 3.5rem of targets plus the
                  * home-indicator inset it pads itself with.
                  */}
                <main
                    className="min-w-0 flex-1"
                    style={{ paddingBottom: "calc(3.5rem + var(--safe-area-bottom))" }}
                >
                    <Outlet />
                </main>
            </div>
            <BottomNav />
        </>
    )
}
