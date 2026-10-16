import { lazy, Suspense, useState, type ComponentProps } from "react"

const DocRecord = lazy(() => import("@/components/DocRecord"))

/**
 * DocRecord for screens that open it themselves (`hideButton`, controlled
 * `isOpen`). The dialog and its comboboxes are ~40 kB that nobody needs until
 * a gasto is tapped, so the code is fetched on the first open rather than with
 * the screen.
 *
 * Mounted on first open and kept mounted after, so every later close still
 * gets its exit animation.
 */
export function LazyDocRecord(props: ComponentProps<typeof DocRecord>) {
    const [opened, setOpened] = useState(false)
    if (props.isOpen && !opened) setOpened(true)

    if (!opened) return null

    return (
        <Suspense fallback={null}>
            <DocRecord {...props} />
        </Suspense>
    )
}
