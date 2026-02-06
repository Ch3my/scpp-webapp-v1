import { useEffect } from "react";

import { useAppState } from "./AppState";
import { useNavigate } from "react-router";
import LoadingCircle from "./components/LoadingCircle";
import api from "@/lib/api";

export default function App() {
  let navigate = useNavigate();
  const { apiPrefix, sessionId, setLoggedIn, fetchCategorias, fetchTipoDocs } = useAppState()

  useEffect(() => {
    // Early exit - no need for loading screen
    if (!apiPrefix || !sessionId) {
      setLoggedIn(false)
      navigate("/login")
      return
    }

    async function checkLoginStatus() {
      const { data: check } = await api.get("/check-session")

      if (check.hasErrors) {
        setLoggedIn(false)
        navigate("/login")
        return
      }

      setLoggedIn(true)

      await Promise.all([fetchCategorias(), fetchTipoDocs()]);
      navigate("/dashboard")
    }

    checkLoginStatus();
  }, []);

  return (
    <div className="h-screen w-screen">
      <LoadingCircle />
    </div>
  )
}