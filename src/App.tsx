import { useEffect } from "react";

import { useAppState } from "./AppState";
import { useNavigate } from "react-router";
import LoadingCircle from "./components/LoadingCircle";
import api from "@/lib/api";
import axios from "axios";
import { toast } from "sonner";

/**
 * A server that answered - any status, or a 200 carrying the `{ hasErrors }`
 * envelope the client turns into a throw - has told us something about the
 * session. No response at all means we could not reach it, which on an
 * installed PWA usually just means the phone is offline.
 */
function isUnreachable(error: unknown) {
  return axios.isAxiosError(error) && !error.response;
}

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

    /**
     * Boots on the stored session without talking to the server. Nothing here
     * can be verified until there is a connection, but refusing to start is
     * worse: the login screen is the one place an offline user can make no
     * progress at all, and the persisted query cache already holds the figures
     * they last saw. A session that turns out to be dead fails on the first
     * real request, and the 401 interceptor signs them out then.
     */
    function startOffline() {
      setLoggedIn(true)
      toast("Sin conexión", {
        description: "Mostrando los últimos datos guardados.",
      })
      navigate("/dashboard")
    }

    async function checkLoginStatus() {
      // Saves the eight-second wait below when the phone already knows.
      if (!navigator.onLine) {
        startOffline()
        return
      }

      try {
        // Capped explicitly: with no timeout a captive portal or a sleeping
        // Railway container leaves this on the spinner indefinitely.
        await api.get("/check-session", { timeout: 8000 })
      } catch (error) {
        if (isUnreachable(error)) {
          startOffline()
          return
        }
        // The server answered and rejected us.
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
