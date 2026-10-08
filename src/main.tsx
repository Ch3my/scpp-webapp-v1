import React, { Suspense, lazy } from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { BrowserRouter, Route, Routes } from "react-router";
import { Toaster } from "./components/ui/sonner";
import { SidebarProvider, } from "@/components/ui/sidebar"
import { TooltipProvider } from "@/components/ui/tooltip"
import { useAppState } from "./AppState";
import Dashboard from "./screens/Dashboard";
import { Skeleton } from "./components/ui/skeleton";
import { QueryClientProvider } from '@tanstack/react-query'
import "./App.css";
import "./Custom.css";
import { RequireAuth } from "./components/RequireAuth";
import { Shell } from "./shell/Shell";
import { queryClient } from "./api/queryClient";
import { setUnauthorizedHandler } from "./api/client";

// Dashboard is eager - 90% of users auto-navigate to it from App.tsx
// Lazy load other screens
const Login = lazy(() => import("./screens/Login"));
const Config = lazy(() => import("./screens/Config"));
const Htas = lazy(() => import("./screens/Htas"));
const Assets = lazy(() => import("./screens/Assets"));
const FoodScreen = lazy(() => import("./screens/FoodScreen"));
const ApiKeys = lazy(() => import("./screens/ApiKeys"));
const Proyectos = lazy(() => import("./screens/Proyectos"));

// Keeps the api client free of any routing import
setUnauthorizedHandler(() => {
  if (window.location.pathname !== "/login") {
    window.location.href = "/login";
  }
});

const RootComponent = () => {
  const { isLoggedIn } = useAppState();

  // Prefetch FoodScreen in the background after dashboard settles
  React.useEffect(() => {
    if (!isLoggedIn) return;
    let cleanup: () => void;
    if (typeof window.requestIdleCallback === "function") {
      const id = window.requestIdleCallback(() => import("./screens/FoodScreen"));
      cleanup = () => window.cancelIdleCallback(id);
    } else {
      const id = setTimeout(() => import("./screens/FoodScreen"), 1500);
      cleanup = () => clearTimeout(id);
    }
    return cleanup;
  }, [isLoggedIn]);

  return (
    <>
      <Suspense fallback={
        <div className="flex items-center justify-center h-screen w-screen p-8">
          <div className="w-full max-w-4xl space-y-4">
            <Skeleton className="h-12 w-3/4" />
            <Skeleton className="h-64 w-full" />
            <div className="space-y-2">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-5/6" />
            </div>
          </div>
        </div>
      }>
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
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/htas" element={<Htas />} />
              <Route path="/assets" element={<Assets />} />
              <Route path="/food" element={<FoodScreen />} />
              <Route path="/proyectos" element={<Proyectos />} />
              <Route path="/api-keys" element={<ApiKeys />} />
            </Route>
          </Route>
        </Routes>
      </Suspense>
    </>
  );
};

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <SidebarProvider defaultOpen={false}>
          <TooltipProvider>
            <Toaster position="bottom-center" />
            <RootComponent />
          </TooltipProvider>
        </SidebarProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
);