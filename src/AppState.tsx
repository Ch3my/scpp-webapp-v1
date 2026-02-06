import { create } from "zustand"
import { persist } from "zustand/middleware"
import api from "@/lib/api"


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

export const useAppState = create<State>()(
    persist(
        (set) => ({
            isLoggedIn: false,
            apiPrefix: "",
            sessionId: "",
            categorias: [],
            tipoDocs: [],
            setLoggedIn: (isLoggedIn: boolean) => set({ isLoggedIn }),
            setApiPrefix: (apiPrefix: string) => set({ apiPrefix }),
            setSessionId: (sessionId: string) => set({ sessionId }),
            fetchCategorias: async () => {
                try {
                    const { data } = await api.get("/categorias")
                    set({ categorias: data })
                } catch (error) {
                    console.error("Failed to fetch categorias:", error)
                }
            },

            // Fetch tipoDocs from your API
            fetchTipoDocs: async () => {
                try {
                    const { data } = await api.get("/tipo-docs")
                    set({ tipoDocs: data })
                } catch (error) {
                    console.error("Failed to fetch tipoDocs:", error)
                }
            },
        }),
        {
            name: "app-storage",
        }
    )
)