import * as React from "react"

const MOBILE_BREAKPOINT = 768
const MOBILE_QUERY = `(max-width: ${MOBILE_BREAKPOINT - 1}px)`

// Resolved synchronously so the first paint already knows which shell to render.
// Deferring this to an effect makes every phone load flash the desktop layout.
function getIsMobile() {
  if (typeof window === "undefined") return false
  return window.matchMedia(MOBILE_QUERY).matches
}

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState(getIsMobile)

  React.useEffect(() => {
    const mql = window.matchMedia(MOBILE_QUERY)
    const onChange = (event: MediaQueryListEvent) => setIsMobile(event.matches)
    mql.addEventListener("change", onChange)
    // Re-sync in case the viewport changed between first render and this effect
    setIsMobile(mql.matches)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return isMobile
}
