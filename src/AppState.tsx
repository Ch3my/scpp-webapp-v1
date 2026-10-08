import { create } from "zustand"
import { persist } from "zustand/middleware"

/**
 * Which shell to render. "auto" follows the viewport; the explicit values let
 * someone pin a layout - useful on a tablet, and for checking the mobile shell
 * from a desktop browser.
 */
export type LayoutOverride = "auto" | "mobile" | "desktop"

// Without a default, a fresh install (or storage cleared by the browser) boots
// with a blank apiPrefix and every request fails until someone types the URL by
// hand in /config - unusable on a phone.
const DEFAULT_API_PREFIX =
    import.meta.env.VITE_DEFAULT_API_PREFIX ?? "https://scpp.lezora.cl"

interface State {
    isLoggedIn: boolean
    apiPrefix: string
    sessionId: string
    layoutOverride: LayoutOverride
    setLoggedIn: (isLoggedIn: boolean) => void
    setApiPrefix: (apiPrefix: string) => void
    setSessionId: (sessionId: string) => void
    setLayoutOverride: (layoutOverride: LayoutOverride) => void
}

export const useAppState = create<State>()(
    persist(
        (set) => ({
            isLoggedIn: false,
            apiPrefix: DEFAULT_API_PREFIX,
            sessionId: "",
            layoutOverride: "auto",
            setLoggedIn: (isLoggedIn: boolean) => set({ isLoggedIn }),
            setApiPrefix: (apiPrefix: string) => set({ apiPrefix }),
            setSessionId: (sessionId: string) => set({ sessionId }),
            setLayoutOverride: (layoutOverride: LayoutOverride) => set({ layoutOverride }),
        }),
        {
            name: "app-storage",
            // persist shallow-merges by default, so a previously stored empty
            // apiPrefix would shadow DEFAULT_API_PREFIX forever.
            merge: (persisted, current) => {
                const stored = (persisted ?? {}) as Partial<State>
                return {
                    ...current,
                    ...stored,
                    apiPrefix: stored.apiPrefix || current.apiPrefix,
                }
            },
        }
    )
)