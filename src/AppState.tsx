import { create } from "zustand"


interface State {
    isLoggedIn: boolean
    apiPrefix: string
    sessionId: string
    categorias: any[]
    tipoDocs: any[]
    setLoggedIn: (isLoggedIn: boolean) => void
    setApiPrefix: (apiPrefix: string) => void
    setSessionId: (sessionId: string) => void
    // Async actions to fetch the data
    fetchCategorias: () => Promise<void>
    fetchTipoDocs: () => Promise<void>
}

export const useAppState = create<State>((set, get) => ({
    isLoggedIn: localStorage.getItem("isLoggedIn") === "true",
    apiPrefix: localStorage.getItem("apiPrefix") || "",
    sessionId: localStorage.getItem("sessionId") || "",
    setLoggedIn: (isLoggedIn: boolean) => set({ isLoggedIn }),
    setApiPrefix: (apiPrefix: string) => set({ apiPrefix }),
    setSessionId: (sessionId: string) => set({ sessionId }),
    categorias: [],
    tipoDocs: [],
    fetchCategorias: async () => {
        const { apiPrefix, sessionId } = get()        
        try {
            const response = await fetch(`${apiPrefix}/categorias?sessionHash=${sessionId}`, {
                method: "GET",
                headers: { "Content-Type": "application/json" },
            })
            const data = await response.json()
            set({ categorias: data })
        } catch (error) {
            console.error("Failed to fetch categorias:", error)
        }
    },

    // Fetch tipoDocs from your API
    fetchTipoDocs: async () => {
        const { apiPrefix, sessionId } = get()
        try {
            const response = await fetch(`${apiPrefix}/tipo-docs?sessionHash=${sessionId}`, {
                method: "GET",
                headers: { "Content-Type": "application/json" },
            })
            const data = await response.json()
            set({ tipoDocs: data })
        } catch (error) {
            console.error("Failed to fetch tipoDocs:", error)
        }
    },
}))