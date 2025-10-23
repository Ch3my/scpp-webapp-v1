import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { BrowserRouter, Route, Routes, useLocation } from "react-router";
import { Toaster } from "./components/ui/sonner";
import { SidebarProvider, } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import Login from "./screens/Login";
import Config from "./screens/Config";
import FoodScreen from "./screens/FoodScreen";
import { useAppState } from "./AppState";
import Dashboard from "./screens/Dashboard";
import { Htas } from "./screens/Htas";
import Assets from "./screens/Assets";
import {
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query'
import "./App.css";
import "./Custom.css";

const queryClient = new QueryClient()

const RootComponent = () => {
  const { isLoggedIn } = useAppState();
  const location = useLocation();
  const showSidebar = isLoggedIn && location.pathname !== '/';

  return (
    <SidebarProvider defaultOpen={false}>
      <Toaster position="bottom-center" />
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          {showSidebar && <AppSidebar />}
          <Routes>
            <Route path="/" element={<App />} />
            <Route path="/login" element={<Login />} />
            <Route path="/config" element={<Config />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/htas" element={<Htas />} />
            <Route path="/assets" element={<Assets />} />
            <Route path="/food" element={<FoodScreen />} />
          </Routes>
        </BrowserRouter>
      </QueryClientProvider>
    </SidebarProvider>
  );
};

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <RootComponent />
  </React.StrictMode>
);