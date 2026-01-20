import React, { Suspense, lazy } from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { BrowserRouter, Route, Routes, useLocation } from "react-router";
import { Toaster } from "./components/ui/sonner";
import { SidebarProvider, } from "@/components/ui/sidebar"
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
          <Route element={<RequireAuth />}>
            <Route path="/config" element={<Config />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/htas" element={<Htas />} />
            <Route path="/assets" element={<Assets />} />
            <Route path="/food" element={<FoodScreen />} />
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
          <Toaster position="bottom-center" />
          <RootComponent />
        </SidebarProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
);