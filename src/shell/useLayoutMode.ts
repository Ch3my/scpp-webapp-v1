import { useIsMobile } from "@/hooks/use-mobile"
import { useAppState } from "@/AppState"

export type LayoutMode = "mobile" | "desktop"

/**
 * Resolves the viewport against the user's stored preference.
 *
 * useIsMobile reads matchMedia synchronously on first render, so this is
 * correct on the very first paint - rendering the desktop shell for a frame on
 * a phone would be visible.
 */
export function useLayoutMode(): LayoutMode {
    const isMobile = useIsMobile()
    const layoutOverride = useAppState((state) => state.layoutOverride)

    if (layoutOverride === "mobile" || layoutOverride === "desktop") {
        return layoutOverride
    }
    return isMobile ? "mobile" : "desktop"
}
