import { registerSW } from "virtual:pwa-register";
import { toast } from "sonner";

// How often a long-lived tab asks the server whether sw.js changed. An
// installed PWA on a phone is *resumed*, not reloaded, for days at a time: the
// browser only checks for a new worker on a real navigation (and at most once a
// day on its own), so without this a deploy can take weeks to reach a device.
const UPDATE_CHECK_INTERVAL_MS = 30 * 60 * 1000;

// Floor between checks, so tabbing in and out of the app does not fire one per
// switch.
const UPDATE_CHECK_THROTTLE_MS = 60 * 1000;

/**
 * Service worker registration with an update path.
 *
 * The plugin's own injected `registerSW.js` only calls
 * `navigator.serviceWorker.register()` - it never reloads the page, so a new
 * worker could take control while the already-running document kept executing
 * the *old* JS modules from memory. That is why installed phones stayed on the
 * old version. Everything that makes an update actually land lives here.
 */
export function registerServiceWorker() {
  let updateWaiting = false;
  let lastCheck = 0;

  // `registerType` is "prompt": a new worker installs and then waits, leaving
  // the running page on its own precached chunks until we say go. (Under
  // "autoUpdate" the new worker activates immediately and `cleanupOutdatedCaches`
  // drops those chunks, so a lazy route in the still-running old page 404s.)
  const applyUpdate = registerSW({
    immediate: true,
    onNeedRefresh() {
      updateWaiting = true;

      // App is backgrounded: reload now so the next resume is already the new
      // version and there is no toast to notice.
      if (document.visibilityState === "hidden") {
        void applyUpdate();
        return;
      }

      toast("Nueva versión disponible", {
        id: "pwa-update",
        description: "Recarga para aplicarla.",
        duration: Infinity,
        action: { label: "Recargar", onClick: () => void applyUpdate() },
      });
    },
    onRegisteredSW(_swUrl, registration) {
      if (!registration) return;

      const checkForUpdate = () => {
        if (updateWaiting || !navigator.onLine) return;
        if (Date.now() - lastCheck < UPDATE_CHECK_THROTTLE_MS) return;
        lastCheck = Date.now();
        // Rejects when offline or the server is unreachable; the next check
        // picks it up.
        registration.update().catch(() => {});
      };

      setInterval(checkForUpdate, UPDATE_CHECK_INTERVAL_MS);

      document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "visible") checkForUpdate();
        else if (updateWaiting) void applyUpdate();
      });

      // Coming back from a dead connection is the other moment worth checking.
      window.addEventListener("online", checkForUpdate);
    },
  });
}
