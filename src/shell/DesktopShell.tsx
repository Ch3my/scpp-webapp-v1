import { Outlet } from "react-router"
import { AppSidebar } from "@/components/app-sidebar"

/**
 * The layout the app has always had: the collapsible sidebar beside whatever
 * the route renders. Screens own their own sizing, so there is no wrapper here
 * on purpose - adding one would change their w-screen/h-screen grids.
 */
export function DesktopShell() {
    return (
        <>
            <AppSidebar />
            <Outlet />
        </>
    )
}
