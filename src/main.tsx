import React, { Suspense, lazy } from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { BrowserRouter, Route, Routes } from "react-router";
import { Toaster } from "./components/ui/sonner";
import { SidebarProvider, } from "@/components/ui/sidebar"
import { TooltipProvider } from "@/components/ui/tooltip"
import { useAppState } from "./AppState";
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import { useIsRestoring } from '@tanstack/react-query'
import { BootSkeleton } from "./shell/BootSkeleton";
import { useLayoutMode } from "./shell/useLayoutMode";
import "./App.css";
import "./Custom.css";
import { RequireAuth } from "./components/RequireAuth";
import { Shell } from "./shell/Shell";
import { responsiveScreen } from "./shell/responsive-screen";
import { queryClient } from "./api/queryClient";
import {
  CACHE_MAX_AGE_MS,
  dehydrateOptions,
  hydrateOptions,
  queryPersister,
} from "./api/persist";
import { setUnauthorizedHandler } from "./api/client";
import { disablePageZoom } from "./lib/disable-page-zoom";
import { registerServiceWorker } from "./lib/pwa";

// Every screen is lazy, Dashboard included. It used to be eager because nearly
// every start lands on it, but that put the desktop Dashboard and its whole
// import tree (gasto dialog, calendar, combobox) in the entry chunk on phones
// too. The landing screen's chunk is instead fetched during the cache restore
// - see RootComponent.
const loadDashboard = () => import("./screens/Dashboard");
const Dashboard = lazy(loadDashboard);
const Login = lazy(() => import("./screens/Login"));
const Config = lazy(() => import("./screens/Config"));
const Htas = lazy(() => import("./screens/Htas"));
const Assets = lazy(() => import("./screens/Assets"));
const FoodScreen = lazy(() => import("./screens/FoodScreen"));
const ApiKeys = lazy(() => import("./screens/ApiKeys"));
const Proyectos = lazy(() => import("./screens/Proyectos"));

// Mobile counterparts. Lazy on both sides, so a desktop session never fetches
// these and a phone never fetches the dense desktop screens.
const loadMobileDashboard = () => import("./screens/mobile/Dashboard");
const MobileDashboard = lazy(loadMobileDashboard);
const MobileAssets = lazy(() => import("./screens/mobile/Assets"));
const MobileFoodScreen = lazy(() => import("./screens/mobile/FoodScreen"));
const MobileProyectos = lazy(() => import("./screens/mobile/Proyectos"));
const MobileApiKeys = lazy(() => import("./screens/mobile/ApiKeys"));

const DashboardScreen = responsiveScreen(Dashboard, MobileDashboard);
const AssetsScreen = responsiveScreen(Assets, MobileAssets);
const FoodRoute = responsiveScreen(FoodScreen, MobileFoodScreen);
const ProyectosScreen = responsiveScreen(Proyectos, MobileProyectos);
const ApiKeysScreen = responsiveScreen(ApiKeys, MobileApiKeys);

disablePageZoom();

// Registers the service worker and owns the update-and-reload path. No-op in
// `vite dev` (the plugin resolves a stub there).
registerServiceWorker();

// Keeps the api client free of any routing import
setUnauthorizedHandler(() => {
  if (window.location.pathname !== "/login") {
    window.location.href = "/login";
  }
});

const RootComponent = () => {
  const { isLoggedIn } = useAppState();
  const isRestoring = useIsRestoring();
  const layoutMode = useLayoutMode();

  /*
   * The landing screen is lazy, and React only asks for a lazy chunk when it
   * renders - which is after the restore below. Fetch it during the restore
   * instead, so the two waits overlap rather than queue.
   */
  React.useEffect(() => {
    const { pathname } = window.location;
    if (pathname !== "/" && pathname !== "/dashboard") return;
    void (layoutMode === "mobile" ? loadMobileDashboard() : loadDashboard());
  }, [layoutMode]);

  // Prefetch this layout's FoodScreen in the background after dashboard settles
  React.useEffect(() => {
    if (!isLoggedIn) return;
    const prefetch = () =>
      layoutMode === "mobile"
        ? import("./screens/mobile/FoodScreen")
        : import("./screens/FoodScreen");
    let cleanup: () => void;
    if (typeof window.requestIdleCallback === "function") {
      const id = window.requestIdleCallback(() => void prefetch());
      cleanup = () => window.cancelIdleCallback(id);
    } else {
      const id = setTimeout(() => void prefetch(), 1500);
      cleanup = () => clearTimeout(id);
    }
    return cleanup;
  }, [isLoggedIn, layoutMode]);

  /*
   * Hold the routes until the persisted cache is in memory. Reading IndexedDB
   * takes a macrotask at minimum, while App.tsx's optimistic navigate to
   * /dashboard is synchronous - so without this the dashboard mounts first and
   * renders a frame or two of zeroes before the restored figures arrive, which
   * on a finance screen reads as data loss rather than as loading.
   */
  if (isRestoring) {
    return <BootSkeleton />;
  }

  return (
    <>
      <Suspense fallback={<BootSkeleton />}>
        <Routes>
          <Route path="/" element={<App />} />
          <Route path="/login" element={<Login />} />
          <Route path="/config" element={<Config />} />
          <Route element={<RequireAuth />}>
            {/*
              * Shell picks the desktop or mobile chrome. Paths are unchanged in
              * both, so any URL opens correctly on either.
              */}
            <Route element={<Shell />}>
              <Route path="/dashboard" element={<DashboardScreen />} />
              {/* Htas is a single centred card already - no mobile variant needed */}
              <Route path="/htas" element={<Htas />} />
              <Route path="/assets" element={<AssetsScreen />} />
              <Route path="/food" element={<FoodRoute />} />
              <Route path="/proyectos" element={<ProyectosScreen />} />
              <Route path="/api-keys" element={<ApiKeysScreen />} />
            </Route>
          </Route>
        </Routes>
      </Suspense>
    </>
  );
};

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    {/*
      * Not QueryClientProvider: this one restores the cache from IndexedDB
      * first and holds queries off until it lands, so a cold start - including
      * one with no connection - renders the last known data instead of empty
      * screens. See api/persist.ts.
      */}
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister: queryPersister,
        maxAge: CACHE_MAX_AGE_MS,
        // Changes every build, so an update never hydrates data shaped like
        // the previous wire format.
        buster: __BUILD_ID__,
        dehydrateOptions,
        hydrateOptions,
      }}
    >
      <BrowserRouter>
        <SidebarProvider defaultOpen={false}>
          <TooltipProvider>
            <Toaster position="bottom-center" />
            <RootComponent />
          </TooltipProvider>
        </SidebarProvider>
      </BrowserRouter>
    </PersistQueryClientProvider>
  </React.StrictMode>
);