import type { ComponentType } from "react"
import { useLayoutMode } from "./useLayoutMode"

/**
 * Builds a route element that renders the mobile variant on phones and the
 * desktop one otherwise.
 *
 * Pass `React.lazy` components and only the chosen variant is ever fetched, so
 * neither layout pays for the other's screens.
 */
export function responsiveScreen(
    Desktop: ComponentType,
    Mobile: ComponentType
): ComponentType {
    return function ResponsiveScreen() {
        const Chosen = useLayoutMode() === "mobile" ? Mobile : Desktop
        return <Chosen />
    }
}
