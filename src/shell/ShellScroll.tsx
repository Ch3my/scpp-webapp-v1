import { createContext, useContext, useMemo, type ReactNode, type RefObject } from "react"

interface ShellScroll {
    /** Jumps the shell's scroll area back to the top. */
    scrollToTop: () => void
}

/**
 * No-op by default, so screens shared with the desktop shell (which has no
 * single scroll area of its own) can call this unconditionally.
 */
const ShellScrollContext = createContext<ShellScroll>({ scrollToTop: () => {} })

export function useShellScroll() {
    return useContext(ShellScrollContext)
}

export function ShellScrollProvider({
    scrollRef,
    children,
}: {
    scrollRef: RefObject<HTMLElement | null>
    children: ReactNode
}) {
    const value = useMemo<ShellScroll>(
        () => ({
            scrollToTop: () => {
                // Instant, not smooth: the content below has already been swapped,
                // so animating through it would just be noise.
                scrollRef.current?.scrollTo({ top: 0, behavior: "auto" })
            },
        }),
        [scrollRef]
    )

    return (
        <ShellScrollContext.Provider value={value}>{children}</ShellScrollContext.Provider>
    )
}
