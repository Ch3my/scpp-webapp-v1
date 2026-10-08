const OKLCH_GREEN_600 = { l: 62.7, c: 0.194, h: 149.214 };
const OKLCH_RED_600 = { l: 57.7, c: 0.245, h: 27.325 };

/**
 * Green at 0% through red at 100%, interpolated in Oklch so the midpoints stay
 * evenly bright instead of going muddy the way an sRGB blend does.
 *
 * Lives here rather than in UsagePercentaje so the mobile dashboard can use it
 * without importing that lazily-loaded chart module and undoing its splitting.
 */
export function getPercentageColor(percent: number): string {
    const clampedPercent = Math.max(0, Math.min(100, percent));
    const t = clampedPercent / 100;

    const interpolatedL = OKLCH_GREEN_600.l + (OKLCH_RED_600.l - OKLCH_GREEN_600.l) * t;
    const interpolatedC = OKLCH_GREEN_600.c + (OKLCH_RED_600.c - OKLCH_GREEN_600.c) * t;
    const interpolatedH = OKLCH_GREEN_600.h + (OKLCH_RED_600.h - OKLCH_GREEN_600.h) * t;

    return `oklch(${interpolatedL}% ${interpolatedC} ${interpolatedH})`;
}
