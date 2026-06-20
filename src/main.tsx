import React, { Suspense, lazy } from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { BrowserRouter, Route, Routes, useLocation } from "react-router";
import { Toaster } from "./components/ui/sonner";
import { SidebarProvider, } from "@/components/ui/sidebar"
import { TooltipProvider } from "@/components/ui/tooltip"
import { AppSidebar } from "@/components/app-sidebar"
import { useAppState } from "./AppState";
import Dashboard from "./screens/Dashboard";
import { Skeleton } from "./components/ui/skeleton";
import {
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query'
import "./App.css";
import "./Custom.css";
import { RequireAuth } from "./components/RequireAuth";

// Dashboard is eager - 90% of users auto-navigate to it from App.tsx
// Lazy load other screens
const Login = lazy(() => import("./screens/Login"));
const Config = lazy(() => import("./screens/Config"));
const Htas = lazy(() => import("./screens/Htas"));
const Assets = lazy(() => import("./screens/Assets"));
const FoodScreen = lazy(() => import("./screens/FoodScreen"));
const ApiKeys = lazy(() => import("./screens/ApiKeys"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 120, // data stays fresh, no refetch on window focus
    },
  },
})

const RootComponent = () => {
  const { isLoggedIn } = useAppState();
  const location = useLocation();
  const showSidebar = isLoggedIn && location.pathname !== '/';

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
      {showSidebar && <AppSidebar />}
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
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/htas" element={<Htas />} />
            <Route path="/assets" element={<Assets />} />
            <Route path="/food" element={<FoodScreen />} />
            <Route path="/api-keys" element={<ApiKeys />} />
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