import {
    FolderKanban,
    Home,
    KeyRound,
    Settings,
    SquarePlay,
    Wheat,
    type LucideIcon,
} from "lucide-react"

export interface NavItem {
    title: string
    url: string
    icon: LucideIcon
}

/**
 * Single source of truth for the app's navigation, shared by the desktop
 * sidebar and the mobile bottom bar.
 *
 * Order matters: the sidebar renders this list as-is, so it is kept exactly as
 * it was when it lived in app-sidebar.tsx.
 *
 * `as const satisfies` is what makes NavUrl a literal union, so a typo in the
 * mobile tab list below is a compile error rather than a blank screen.
 */
export const navItems = [
    { title: "Home", url: "/dashboard", icon: Home },
    { title: "Assets", url: "/assets", icon: SquarePlay },
    { title: "Food", url: "/food", icon: Wheat },
    { title: "Proyectos", url: "/proyectos", icon: FolderKanban },
    { title: "API Keys", url: "/api-keys", icon: KeyRound },
    { title: "Settings", url: "/htas", icon: Settings },
] as const satisfies readonly NavItem[]

export type NavUrl = (typeof navItems)[number]["url"]

/**
 * Which destinations get a bottom-bar tab on mobile, in tab order. A bottom bar
 * holds about five targets comfortably, so the rest live behind "Más".
 *
 * Declared separately from `navItems` rather than as a flag on it, because the
 * mobile tab order is not the sidebar order.
 */
const MOBILE_TAB_URLS: readonly NavUrl[] = [
    "/dashboard",
    "/food",
    "/proyectos",
    "/assets",
]

export const mobileTabItems: readonly NavItem[] = MOBILE_TAB_URLS.map(
    (url) => navItems.find((item) => item.url === url) as NavItem
)

export const mobileOverflowItems: readonly NavItem[] = navItems.filter(
    (item) => !MOBILE_TAB_URLS.includes(item.url)
)

/** The nav entry whose route is currently active, if any. */
export function findNavItem(pathname: string): NavItem | undefined {
    return navItems.find((item) => item.url === pathname)
}
