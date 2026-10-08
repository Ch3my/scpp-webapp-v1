import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { XIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import {
    Dialog,
    DialogClose,
    DialogContent as CenteredDialogContent,
    DialogDescription,
    DialogFooter as CenteredDialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { useLayoutMode } from "@/shell/useLayoutMode"

/**
 * A dialog that is a centered modal on desktop and a bottom sheet on mobile.
 *
 * Exports are named exactly like `@/components/ui/dialog`, so a dialog adopts
 * it by changing only its import path.
 *
 * Both ui/dialog and ui/sheet are built on @radix-ui/react-dialog, so the root,
 * trigger, title, description and close are literally the same primitive - only
 * the content's positioning differs. That is all this module switches.
 */

function BottomSheetContent({
    className,
    children,
    showCloseButton = true,
    ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & {
    showCloseButton?: boolean
}) {
    return (
        <DialogPrimitive.Portal>
            <DialogPrimitive.Overlay
                className="data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/50"
            />
            <DialogPrimitive.Content
                data-slot="dialog-content"
                className={cn(
                    "bg-background fixed inset-x-0 bottom-0 z-50 flex w-full flex-col gap-4 rounded-t-xl border-t p-4 shadow-lg",
                    "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom duration-200",
                    // Tall forms (DocRecord) have to scroll rather than run off screen
                    "max-h-[85dvh] overflow-y-auto overscroll-contain",
                    className,
                    // Last so tailwind-merge drops any sm:max-w-* the caller passed:
                    // those are inert on a real phone but would fight the full-width
                    // sheet when the mobile layout is forced on a wide screen.
                    "sm:max-w-none"
                )}
                style={{ paddingBottom: "calc(1rem + var(--safe-area-bottom))" }}
                {...props}
            >
                {children}
                {showCloseButton && (
                    <DialogPrimitive.Close
                        className="ring-offset-background focus:ring-ring absolute top-4 right-4 rounded-xs opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-hidden [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"
                    >
                        <XIcon />
                        <span className="sr-only">Close</span>
                    </DialogPrimitive.Close>
                )}
            </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
    )
}

function DialogContent(
    props: React.ComponentProps<typeof DialogPrimitive.Content> & {
        showCloseButton?: boolean
    }
) {
    return useLayoutMode() === "mobile" ? (
        <BottomSheetContent {...props} />
    ) : (
        <CenteredDialogContent {...props} />
    )
}

/**
 * Stacks full-width buttons on mobile instead of the desktop right-aligned row,
 * so actions are thumb-sized.
 */
function DialogFooter({ className, ...props }: React.ComponentProps<"div">) {
    const isMobile = useLayoutMode() === "mobile"

    return (
        <CenteredDialogFooter
            className={cn(
                isMobile && "flex-col gap-2 [&>button]:min-h-11 [&>button]:w-full",
                className
            )}
            {...props}
        />
    )
}

export {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
}
