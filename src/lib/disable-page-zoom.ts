/**
 * Make the page behave like app chrome rather than a document: no browser zoom.
 *
 * Three mechanisms, because no single one covers every browser:
 *  - `maximum-scale=1, user-scalable=no` on the viewport meta (index.html)
 *    covers Android Chrome and an installed PWA.
 *  - `touch-action: pan-x pan-y` on <html> (Custom.css) drops pinch-zoom and
 *    double-tap zoom wherever touch-action is honoured, while leaving scroll.
 *  - this file covers iOS Safari, which ignores the meta: it fires non-standard
 *    `gesture*` events for a pinch, and zooms a multi-touch `touchmove` unless
 *    the default is prevented.
 *
 * Zooming an image is the only zoom in the app. AssetImgViewer deliberately
 * does *not* opt out of any of this - it implements pinch, drag and double-tap
 * from pointer events, so the browser has to stay out of the way there too.
 * Cancelling `touchmove` does not stop pointer events, so the two coexist;
 * cancelling `touchstart` would, which is why it is left alone below.
 */
export function disablePageZoom() {
    const stop = (e: Event) => e.preventDefault();

    // Safari-only pinch events. No-ops everywhere else.
    for (const type of ['gesturestart', 'gesturechange', 'gestureend']) {
        document.addEventListener(type, stop, { passive: false });
    }

    document.addEventListener(
        'touchmove',
        (e) => {
            // More than one finger moving is a pinch, never a scroll.
            if (e.touches.length > 1) e.preventDefault();
        },
        { passive: false }
    );
}
