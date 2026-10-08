import * as React from "react"

/**
 * Pixels of the layout viewport hidden at the bottom by the on-screen keyboard.
 *
 * `position: fixed; bottom: 0` anchors to the *layout* viewport, and mobile
 * browsers leave that at full height when the keyboard opens (Chrome Android's
 * default `interactive-widget=resizes-visual`, and iOS Safari always). A bottom
 * sheet therefore stays put *under* the keyboard and you cannot see what you
 * are typing. `visualViewport` is the only thing that reports the shrunken
 * area; offsetting the sheet by this much lifts it back into view.
 *
 * Returns 0 on browsers that do resize the layout viewport, so callers can
 * apply it unconditionally.
 */
function getKeyboardInset() {
  if (typeof window === "undefined" || !window.visualViewport) return 0
  const vv = window.visualViewport
  return Math.max(0, Math.round(window.innerHeight - vv.height - vv.offsetTop))
}

export function useKeyboardInset() {
  const [inset, setInset] = React.useState(getKeyboardInset)

  React.useEffect(() => {
    const vv = window.visualViewport
    if (!vv) return

    // `scroll` matters too: iOS Safari pans the visual viewport when it opens
    // the keyboard, which changes offsetTop without firing resize again.
    const onChange = () => setInset(getKeyboardInset())
    vv.addEventListener("resize", onChange)
    vv.addEventListener("scroll", onChange)
    onChange()

    return () => {
      vv.removeEventListener("resize", onChange)
      vv.removeEventListener("scroll", onChange)
    }
  }, [])

  return inset
}
