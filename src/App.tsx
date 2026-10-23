import { useEffect } from "react";

import { useAppState } from "./AppState";
import { useNavigate } from "react-router";
import { BootSkeleton } from "./shell/BootSkeleton";
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

/**
 * /check-session is retried before the app calls itself offline. One 8 s
 * attempt was not enough: Railway sleeps idle containers, and a cold start
 * regularly outlasts it, so the first open of the day said "Sin conexión" to a
 * phone that was online. A timed-out request still wakes the container, so the
 * early attempts can be short; the timeout then doubles up to a 15 s cap, and
 * the pause between attempts doubles too.
 */
const PROBE_RETRIES = 2
const probeTimeout = (attempt: number) => Math.min(4000 * 2 ** attempt, 15000)
const probeDelay = (attempt: number) => 1000 * 2 ** (attempt - 1)

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

      for (let attempt = 0; attempt <= PROBE_RETRIES; attempt++) {
        if (attempt > 0) {
          await new Promise((resolve) => setTimeout(resolve, probeDelay(attempt)))
          if (!navigator.onLine) break
        }
        try {
          // Capped explicitly: with no timeout a captive portal leaves this
          // promise pending for as long as the app is open.
          await api.get("/check-session", { timeout: probeTimeout(attempt) })
          return
        } catch (error) {
          // Any answer other than "unreachable" is either a 401 - already
          // handled by the interceptor, which is redirecting as we speak - or
          // a sick backend, and sending someone to a login screen they cannot
          // use either would not help. The screens' own queries will surface it.
          if (!isUnreachable(error)) return
        }
      }
      notifyOffline()
    }

    setLoggedIn(true)
    // replace: the boot route must not sit in history, or the Android back
    // button lands on a spinner that immediately throws you forward again.
    navigate("/dashboard", { replace: true })

    void verifySession()
  }, []);

  return <BootSkeleton />

}
