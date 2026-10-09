import { createContext, useContext } from "react"

/**
 * The Dashboard's "para" filter: 0 means everyone, otherwise a miembro id.
 *
 * The chart components fetch their own series, and both layouts render them, so the
 * filter reaches them through context instead of a prop threaded through each one.
 * Outside a Dashboard (no provider) it reads 0, i.e. unfiltered.
 */
const DashboardMiembroContext = createContext<number>(0)

export const DashboardMiembroProvider = DashboardMiembroContext.Provider

export function useDashboardMiembro(): number {
  return useContext(DashboardMiembroContext)
}
