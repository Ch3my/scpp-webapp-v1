import { useRef } from "react"
import { Outlet, useLocation } from "react-router"
import { BottomNav } from "./BottomNav"
import { findNavItem } from "./nav-items"
import { ShellScrollProvider } from "./ShellScroll"

/**
 * Phone layout, as a fixed app shell: title bar, scrolling content, bottom bar.
 *
 * The outer element is `fixed inset-0` so it is exactly the viewport, and the
 * only scroll container is <main>. That keeps the bottom bar permanently on
 * screen structurally, rather than relying on position:fixed - which mobile
 * browsers displace as soon as a page overflows horizontally, and which is why
 * the bar could disappear on long or wide content.
 *
 * `overflow-x-hidden` lives on <main>, never on an ancestor of the sticky-free
 * header: putting it higher would turn an ancestor into a scroll container and
 * is a common way to break layout here.
 *
 * AppSidebar is deliberately not mounted - BottomNav is the whole of mobile
 * navigation. The SidebarTrigger that desktop screens render via ScreenTitle is
 * therefore inert in mobile mode (harmless: it toggles provider state with no
 * Sidebar listening). Only /htas still shows one.
 */
export function MobileShell() {
    const location = useLocation()
    const current = findNavItem(location.pathname)
    const scrollRef = useRef<HTMLElement>(null)

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

            <main
                ref={scrollRef}
                className="min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain"
            >
                {/* Lets a screen jump this area back to the top - e.g. when a
                    chart bar switches tabs and the content changes entirely. */}
                <ShellScrollProvider scrollRef={scrollRef}>
                    <Outlet />
                </ShellScrollProvider>
            </main>

            <BottomNav />
        </div>
    )
}
