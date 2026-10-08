import { useEffect } from "react";

import { useAppState } from "./AppState";
import { useNavigate } from "react-router";
import LoadingCircle from "./components/LoadingCircle";
import api from "@/lib/api";
import axios from "axios";
import { toast } from "sonner";

/**
 * A server that answered has told us something about the session. No response
 * at all means we could not reach it, which on an installed PWA usually just
 * means the phone is offline - or that Railway is still waking the container.
 */
function isUnreachable(error: unknown) {
  return axios.isAxiosError(error) && !error.response;
}

function notifyOffline() {
  toast("Sin conexión", {
    description: "Mostrando los últimos datos guardados.",
  });
}

/**
 * The boot route. Its whole job is deciding where to send someone who opened
 * the app at "/".
 *
 * It does that optimistically: a stored session is good enough to render with,
 * so the dashboard mounts immediately and the session is verified behind it.
 * Waiting for /check-session (and then the two catalog fetches) used to put
 * three sequential round-trips in front of the first paint, which on mobile
 * data is most of what a cold start feels like. Now they overlap with the
 * dashboard's own queries, and the persisted cache (api/persist.ts) means that
 * first paint already has real figures in it.
 *
 * Nothing is trusted that should not be: an invalid session is a 401 from the
 * API, and the interceptor in api/client.ts clears the session, drops the
 * persisted cache and redirects. Rendering a screen the user is no longer
 * entitled to for a few hundred milliseconds costs nothing - the data in it is
 * their own, from their own last session.
 */
export default function App() {
  let navigate = useNavigate();
  const { apiPrefix, sessionId, setLoggedIn } = useAppState()

  useEffect(() => {
    // Nothing to be optimistic about: no stored session at all.
    if (!apiPrefix || !sessionId) {
      setLoggedIn(false)
      navigate("/login", { replace: true })
      return
    }

    async function verifySession() {
      // The phone already knows there is no point, and this keeps the notice
      // immediate instead of eight seconds late.
      if (!navigator.onLine) {
        notifyOffline()
        return
      }

      try {
        // Capped explicitly: with no timeout a captive portal leaves this
        // promise pending for as long as the app is open.
        await api.get("/check-session", { timeout: 8000 })
      } catch (error) {
        if (isUnreachable(error)) {
          notifyOffline()
        }
        // Any other answer is either a 401 - already handled by the
        // interceptor, which is redirecting as we speak - or a sick backend,
        // and sending someone to a login screen they cannot use either would
        // not help. The screens' own queries will surface it.
      }
    }

    setLoggedIn(true)
    // replace: the boot route must not sit in history, or the Android back
    // button lands on a spinner that immediately throws you forward again.
    navigate("/dashboard", { replace: true })

    void verifySession()
  }, []);

  return (
    <div className="h-screen w-screen">
      <LoadingCircle />
    </div>
  )
}
