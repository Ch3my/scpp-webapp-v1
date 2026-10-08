import { DesktopShell } from "./DesktopShell"
import { MobileShell } from "./MobileShell"
import { useLayoutMode } from "./useLayoutMode"

/**
 * Layout route for every authenticated screen. Route paths are identical in
 * both modes, so a URL works wherever it is opened.
 */
export function Shell() {
    return useLayoutMode() === "mobile" ? <MobileShell /> : <DesktopShell />
}
