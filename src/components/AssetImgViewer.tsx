import React, { useCallback, useEffect, useRef, useState } from 'react';

interface AssetImgViewerProps {
  base64Img?: string | null;
}

type Point = { x: number; y: number };
type View = { scale: number; x: number; y: number };

const FIT: View = { scale: 1, x: 0, y: 0 };
const MAX_SCALE = 6;
/**
 * Below 1 the whole image is already visible, so zooming out further only
 * shrinks it - but pinching in and hitting a wall feels broken, so allow some
 * room. `clamp` pins the image to the centre at anything under 1.
 */
const MIN_SCALE = 0.5;
const DOUBLE_TAP_SCALE = 2.5;
const DOUBLE_TAP_MS = 300;
/** A press that travels further than this is a drag, not a tap. */
const TAP_SLOP_PX = 10;
/**
 * Zoom per normalised wheel pixel, as an exponent. With the cap below, one
 * mouse notch is at most e^0.12 ≈ 1.13x, so crossing 1 -> MAX_SCALE takes
 * about fifteen notches instead of three.
 */
const WHEEL_ZOOM_RATE = 0.0012;
/**
 * A single wheel event never counts for more than this many pixels. `deltaY`
 * is device- and browser-dependent - a notch is 100px in Chrome but can arrive
 * as 120, 240 or an accelerated burst on high-resolution wheels - so without a
 * cap the step size is whatever the mouse happens to report.
 */
const WHEEL_DELTA_CAP_PX = 100;
/** Fallback px per line for `deltaMode: DOM_DELTA_LINE` (Firefox reports 3). */
const WHEEL_LINE_HEIGHT_PX = 16;

const clampScale = (s: number) => Math.min(Math.max(MIN_SCALE, s), MAX_SCALE);

/**
 * `deltaY` in pixels, capped. Trackpads emit many small events and stay
 * proportional (including the ctrl+wheel stream a trackpad pinch produces);
 * only a coarse notch hits the cap.
 */
const normalizeWheel = (e: WheelEvent, container: HTMLElement) => {
  const perUnit =
    e.deltaMode === WheelEvent.DOM_DELTA_LINE
      ? WHEEL_LINE_HEIGHT_PX
      : e.deltaMode === WheelEvent.DOM_DELTA_PAGE
        ? container.clientHeight
        : 1;
  const px = e.deltaY * perUnit;
  return Math.min(Math.max(px, -WHEEL_DELTA_CAP_PX), WHEEL_DELTA_CAP_PX);
};

/**
 * Pan + pinch image viewer, driven entirely by pointer events so one code path
 * serves mouse (wheel zoom, drag) and touch (pinch, drag, double-tap) - the
 * same gestures the native app gives this screen.
 *
 * The image is laid out fitted and centred (`absolute inset-0 m-auto` with
 * max-width/height), and all zooming is a transform on top of that, so scale 1
 * always means "whole image visible". `transform-origin` stays at its default
 * centre, which is what makes the gesture maths below work in coordinates
 * measured from the container centre.
 *
 * `touch-action: none` is essential: without it the browser claims the gesture
 * for page scroll/zoom and cancels the pointer stream mid-pinch.
 */
const AssetImgViewer: React.FC<AssetImgViewerProps> = ({ base64Img }) => {
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [view, setView] = useState<View>(FIT);
  const [isGesturing, setIsGesturing] = useState(false);

  // The transform also lives in a ref so gesture handlers read the current
  // value instead of whatever was captured when they were created.
  const viewRef = useRef<View>(FIT);

  /** Live pointers by id. A ref: these change every frame and render nothing. */
  const pointers = useRef(new Map<number, Point>());
  /**
   * Snapshot taken whenever the number of pointers changes, so a gesture is
   * always measured from where the fingers were at that moment. Re-anchoring on
   * every up/down is what stops the image jumping when a second finger joins or
   * leaves mid-pinch.
   */
  const anchor = useRef<{ view: View; center: Point; distance: number } | null>(null);
  const tap = useRef<{ x: number; y: number; at: number } | null>(null);
  const lastTapAt = useRef(0);

  /** Container-centre-relative coordinates: the frame the maths works in. */
  const toLocal = useCallback((clientX: number, clientY: number): Point => {
    const rect = containerRef.current!.getBoundingClientRect();
    return {
      x: clientX - rect.left - rect.width / 2,
      y: clientY - rect.top - rect.height / 2,
    };
  }, []);

  /**
   * Keep the image covering the container while it is larger than the
   * container, and pinned to the centre while it is not. Without this the
   * picture can be flung off screen with no way back.
   */
  const clamp = useCallback((next: View): View => {
    const img = imgRef.current;
    const container = containerRef.current;
    if (!img || !container) return next;
    const maxX = Math.max(0, (img.offsetWidth * next.scale - container.clientWidth) / 2);
    const maxY = Math.max(0, (img.offsetHeight * next.scale - container.clientHeight) / 2);
    return {
      scale: next.scale,
      x: Math.min(Math.max(next.x, -maxX), maxX),
      y: Math.min(Math.max(next.y, -maxY), maxY),
    };
  }, []);

  const apply = useCallback(
    (next: View) => {
      const clamped = clamp(next);
      viewRef.current = clamped;
      setView(clamped);
    },
    [clamp]
  );

  /**
   * Move to `scale` while taking the image point under `focus` to
   * `destination` (both centre-relative). Solving
   * `screen = translate + scale * imagePoint` for the new translate gives the
   * single expression below, which covers a pure pan (scale unchanged), a
   * wheel/double-tap zoom (focus === destination) and a pinch that both scales
   * and moves.
   */
  const moveTo = useCallback(
    (scale: number, focus: Point, destination: Point, from: View) => {
      const next = clampScale(scale);
      const ratio = next / from.scale;
      apply({
        scale: next,
        x: destination.x - ratio * (focus.x - from.x),
        y: destination.y - ratio * (focus.y - from.y),
      });
    },
    [apply]
  );

  /** Centroid and spread of every pointer currently down. */
  const measure = useCallback(() => {
    const list = [...pointers.current.values()];
    const sum = list.reduce((acc, p) => ({ x: acc.x + p.x, y: acc.y + p.y }), { x: 0, y: 0 });
    const center = toLocal(sum.x / list.length, sum.y / list.length);
    const distance =
      list.length < 2 ? 0 : Math.hypot(list[0].x - list[1].x, list[0].y - list[1].y);
    return { center, distance };
  }, [toLocal]);

  const reanchor = useCallback(() => {
    anchor.current =
      pointers.current.size === 0 ? null : { view: viewRef.current, ...measure() };
  }, [measure]);

  // Reset when the asset changes - otherwise the next image opens zoomed into
  // wherever the previous one was left.
  useEffect(() => {
    viewRef.current = FIT;
    setView(FIT);
    pointers.current.clear();
    anchor.current = null;
  }, [base64Img]);

  // Native listener with `passive: false`: React registers onWheel passively,
  // so preventDefault there is ignored and ctrl+wheel zooms the whole page.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const from = viewRef.current;
      const focus = toLocal(e.clientX, e.clientY);
      moveTo(from.scale * Math.exp(-normalizeWheel(e, el) * WHEEL_ZOOM_RATE), focus, focus, from);
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [toLocal, moveTo]);

  const toggleZoomAt = useCallback(
    (clientX: number, clientY: number) => {
      const from = viewRef.current;
      // Anywhere off fit - zoomed in or out - the double tap means "back to
      // fit"; only from fit itself does it zoom in.
      if (Math.abs(from.scale - 1) > 0.01) {
        apply(FIT);
        return;
      }
      const focus = toLocal(clientX, clientY);
      moveTo(DOUBLE_TAP_SCALE, focus, focus, from);
    },
    [apply, moveTo, toLocal]
  );

  const handlePointerDown = (e: React.PointerEvent) => {
    // Capture so a finger or the mouse leaving the container keeps reporting.
    containerRef.current?.setPointerCapture(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    tap.current =
      pointers.current.size === 1 ? { x: e.clientX, y: e.clientY, at: Date.now() } : null;
    reanchor();
    setIsGesturing(true);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!pointers.current.has(e.pointerId)) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (
      tap.current &&
      Math.hypot(e.clientX - tap.current.x, e.clientY - tap.current.y) > TAP_SLOP_PX
    ) {
      tap.current = null;
    }

    const from = anchor.current;
    if (!from) return;
    const { center, distance } = measure();
    const scale =
      from.distance > 0 && distance > 0
        ? from.view.scale * (distance / from.distance)
        : from.view.scale;
    moveTo(scale, from.center, center, from.view);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!pointers.current.delete(e.pointerId)) return;

    const point = tap.current;
    tap.current = null;
    reanchor();

    if (pointers.current.size > 0) return;
    setIsGesturing(false);

    // Touch double-tap. Not dblclick: iOS does not emit it reliably, and
    // pointer type is checked so a mouse does not count a tap twice.
    if (!point || e.pointerType === 'mouse' || Date.now() - point.at > 500) return;
    const now = Date.now();
    if (now - lastTapAt.current < DOUBLE_TAP_MS) {
      lastTapAt.current = 0;
      toggleZoomAt(point.x, point.y);
    } else {
      lastTapAt.current = now;
    }
  };

  if (!base64Img) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      className="relative h-full w-full overflow-hidden"
      style={{
        // The browser must not read any of this as scrolling or zooming.
        touchAction: 'none',
        cursor: view.scale > 1 ? (isGesturing ? 'grabbing' : 'grab') : 'default',
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onDoubleClick={(e) => toggleZoomAt(e.clientX, e.clientY)}
    >
      <img
        ref={imgRef}
        draggable={false}
        src={base64Img}
        alt="Asset"
        className="absolute inset-0 m-auto max-h-full max-w-full select-none"
        style={{
          transform: `translate(${view.x}px, ${view.y}px) scale(${view.scale})`,
          transition: isGesturing ? 'none' : 'transform 0.15s ease-out',
          // Stops iOS offering "Save Image" on a long press mid-pan.
          WebkitTouchCallout: 'none',
        }}
      />
    </div>
  );
};

export default AssetImgViewer;
