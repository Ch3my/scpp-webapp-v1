import { Home, KeyRound, Settings, SquarePlay, Wheat } from "lucide-react"
import { Link, useLocation } from "react-router"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

// Menu items.
const items = [
  {
    title: "Home",
    url: "/dashboard",
    icon: Home,
  },
  {
    title: "Assets",
    url: "/assets",
    icon: SquarePlay,
  },
  {
    title: "Food",
    url: "/food",
    icon: Wheat,
  },
  {
    title: "API Keys",
    url: "/api-keys",
    icon: KeyRound,
  },
  {
    title: "Settings",
    url: "/htas",
    icon: Settings,
  },
]

export function AppSidebar() {
  const location = useLocation()

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>SCPP</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={location.pathname === item.url}>
                    <Link to={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}
