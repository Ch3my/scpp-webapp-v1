import { lazy, Suspense, type ComponentProps } from "react"

/**
 * The calendar is react-day-picker + date-fns, ~75 kB, and it only exists
 * inside an open date popover. Importing it directly put all of that in front
 * of the dashboard's first paint, because the date filters render a trigger
 * there. Loaded on first open instead - from the service worker's precache, so
 * the wait is a few milliseconds.
 */
const Calendar = lazy(() =>
    import("@/components/ui/calendar").then((m) => ({ default: m.Calendar }))
)

export function LazyCalendar(props: ComponentProps<typeof Calendar>) {
    return (
        // Roughly a month grid, so the popover does not open tiny and then jump
        <Suspense fallback={<div className="h-72 w-64" />}>
            <Calendar {...props} />
        </Suspense>
    )
}
