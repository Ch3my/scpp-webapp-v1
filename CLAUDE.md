# SCPP Web App — working notes

Personal finance / food-inventory / document app. One codebase serves **two layouts**: a dense
desktop UI and a phone UI, chosen at runtime. It is also an installable PWA.

Stack: React 19, TypeScript 7, Vite 8 (rolldown), Tailwind v4, shadcn/Radix, TanStack Query v5 +
Table v9, Zustand, axios, Luxon, Recharts.

Backend is a **separate repo**: `../scpp-microservice-hono` (Hono + Bun + MariaDB). Dev on
`http://localhost:3000`, prod `https://scpp.lezora.cl`. It serves an OpenAPI spec at
`/openapi.json` and Swagger at `/docs`.

```
npm run dev       # vite dev server (no service worker — see PWA below)
npm run build     # tsc && vite build  — tsc is part of the build, so types gate shipping
npm run preview   # serve dist; the only way to exercise the service worker
npm run gen:api   # regenerate src/api/schema.d.ts from the running backend
```

---

## The one thing to understand first: two shells, one route table

`src/shell/Shell.tsx` is a layout route wrapping every authenticated route. It picks
`DesktopShell` (sidebar + screen) or `MobileShell` (header + scroll area + bottom bar) from
`useLayoutMode()`.

**Route paths are identical in both.** A URL opens correctly wherever it is pasted. Per-route
variant selection happens in `src/main.tsx`:

```tsx
const DashboardScreen = responsiveScreen(Dashboard, MobileDashboard);
```

Both arguments are `React.lazy`, so neither layout downloads the other's screens — the build
emits separate chunks per layout. Keep it that way when adding screens.

`useLayoutMode()` = viewport (`useIsMobile()`, 768px) resolved against a persisted
`layoutOverride` (`auto` | `mobile` | `desktop`) in the Zustand store. **Settings → Layout** forces
either shell, which is how you preview mobile from a desktop browser.

`useIsMobile()` reads `matchMedia` synchronously in the `useState` initialiser. Do not "simplify"
it into an effect — that renders the desktop shell for one frame on every phone load.

### Desktop is deliberately dense — don't "fix" it

The five desktop screens are `w-screen h-screen` with hardcoded multi-column grids
(`Dashboard`, `FoodScreen`, `Proyectos`, `Assets`, `ApiKeys`). That density is the point. Never
make them responsive; build a mobile counterpart instead.

`DesktopShell` renders no wrapper element on purpose — a wrapper would break those grids.

---

## Adding a feature

### 1. Backend first, if there is a new endpoint

Routes need a **real zod response schema** with `.openapi('Name')` in
`../scpp-microservice-hono/src/schemas/`. A route declared `schema: z.any()` produces
`unknown` on this side and documents nothing in Swagger. The service should import the
schema-derived type for its return value, so implementation and contract cannot drift.

### 2. Regenerate types

`npm run gen:api` with the backend running. `src/api/schema.d.ts` is committed, so builds do not
need a live backend.

`src/models/*` are thin re-exports of generated types — keep them that way:

```ts
export type Documento = components["schemas"]["Documento"];
```

**Exception — view models.** `Food` and `FoodTransaction` are hand-written because the wire
format is snake_case with ISO strings and the app wants camelCase + Luxon. The conversion lives
in the query hooks (`src/api/hooks/useFood.ts`), never in components. Dates are parsed
`{ zone: 'utc' }` — the API sends naive timestamps, and parsing them locally shifts dates across
day boundaries.

### 3. Data layer

Everything goes through `src/api/`. **No `api.get(...)` in a component — ever.** The rule is about
*data*; the one exception is `App.tsx`'s `/check-session`, which is a probe whose answer is never
rendered and is worthless a moment later. Putting it behind a query would cache exactly the thing
that must not be cached, so it calls the client directly and `queryKeys` has no `auth` entry.

- `client.ts` — the axios instance. Dynamic `baseURL` from the store, bearer token, and a
  response interceptor that turns a 200-with-`{hasErrors}` envelope into a throw, so callers
  handle one failure channel. The 401 handler is *injected* (`setUnauthorizedHandler` in
  `main.tsx`) to keep this file free of routing imports.
- `queryKeys.ts` — hierarchical key factory. Use it; never inline a key array. Partial
  invalidation depends on the hierarchy.
- `hooks/` — one file per domain, re-exported from `hooks/index.ts`. Components import from
  `@/api/hooks`.

Mutations invalidate *dependents*, not just their own list — a documento write also invalidates
`dashboard` and `proyectos`, because proyecto date ranges are derived from linked gastos.

**The Zustand store holds no server data.** `AppState.tsx` is session (`isLoggedIn`, `sessionId`,
`apiPrefix`) and one preference (`layoutOverride`) — things with no endpoint behind them.
Everything fetched belongs to TanStack Query, which is what gives it staleness, invalidation,
clearing on logout and the persisted offline copy. `categorias`/`tipoDocs` used to live in the
store *as well as* in `useLookups.ts`, fetched by hand at boot and at login while the query hooks
sat unused; the store copy is gone and the hooks are the only source. Don't add a `fetchX` action
to the store.

**`/assets` vs `/assets/{id}`.** The list returns `AssetListItem` (no image); the detail returns
`Asset` with `assetData`. They were one endpoint returning the full `Asset` either way, so opening
the Assets screen downloaded every photo in the account as base64 before displaying one. Two
response schemas rather than an optional field, so the contract says which one has the image.
Note `assets.routes.ts` needs **both** `use('/assets', requireSession)` and
`use('/assets/*', requireSession)` — the first matches only the exact path, and without the second
`GET /assets/{id}` served images unauthenticated (verified: the request reached the handler).

### 4. Screens

Desktop screen in `src/screens/`, mobile counterpart in `src/screens/mobile/`, wired with
`responsiveScreen()`. Both consume the same hooks and the same dialogs.

---

## Mobile rules (each of these came from a real bug)

**Loading state: use `isLoading` or `isPlaceholderData`, never `isFetching`.**
`refetchOnWindowFocus` is on, so `isFetching` is also true during background revalidation —
gating UI on it makes the screen dim or flash every time you return to the tab. `isPlaceholderData`
is true only while showing the *previous* key's data, i.e. a filter change in flight.

**Dialogs: import from `@/components/responsive-dialog`, not `@/components/ui/dialog`.**
Renders a centred modal on desktop and a bottom sheet on mobile. Both are the same Radix primitive
underneath, so only `Content` and `Footer` actually switch; the rest are re-exports. It carries the
8 names every dialog here uses (`Dialog`, `DialogTrigger`, `DialogContent`, `DialogHeader`,
`DialogTitle`, `DialogDescription`, `DialogFooter`, `DialogClose`), so adopting it is an
import-path change — but it does **not** re-export `DialogOverlay` or `DialogPortal`. Add them
there if you ever need them rather than importing from two places.

**Lists: `DataCardList` in `src/components/mobile/`.** Tables do not reflow at phone width.
Put row menus in the **`action` slot**, never inside `renderCard` — the card body is a `<button>`,
and nesting a button inside it is invalid HTML. `compact` tightens padding for dense feeds.

**Master-detail: put the selection in `useSearchParams`, not state** (`/proyectos?id=5`). That is
what makes the Android back button and iOS edge-swipe close the detail instead of leaving the
screen.

**Never use `position: fixed` for app chrome.** `MobileShell` is `fixed inset-0` (exactly the
viewport), `<main>` is the **only** scroll container, and `BottomNav` is the last row of that flex
column. Mobile browsers displace `position: fixed` as soon as a page overflows horizontally, which
is how the nav used to disappear. `overflow-x-hidden` belongs on `<main>` only — on an ancestor it
turns that ancestor into a scroll container and breaks things.

To scroll the shell programmatically use `useShellScroll()` (`src/shell/ShellScroll.tsx`); it is a
no-op on desktop so shared screens can call it unconditionally.

**No fixed widths on anything a phone renders.** A `w-75` on a combobox trigger will not shrink
inside a flex row and overflows the viewport. Use `w-full sm:w-75`. Portaled popovers need
`max-w-[calc(100vw-1.5rem)]`.

**Enlarging for mobile without touching desktop: use the `sm:` reset.**
`text-base sm:text-sm`, `min-h-11 sm:min-h-0`, `h-10 sm:h-6`. These only apply below 640px, so
desktop density is untouched. This is the standard move for shared components.

**Touch targets ≥44px** (`min-h-11`). Several desktop controls are 24px (`h-6`).

**Safe areas**: `--safe-area-top/bottom/left/right` are defined in `Custom.css`. Apply the bottom
inset as *padding* on a bar so its background still reaches the screen edge.

**Browser zoom is off app-wide; only the image viewer zooms.** Three things enforce it because no
one of them covers every browser: `maximum-scale=1, user-scalable=no` on the viewport meta
(`index.html`), `html { touch-action: pan-x pan-y }` (`Custom.css`), and
`disablePageZoom()` from `src/lib/disable-page-zoom.ts`, called in `main.tsx`, for iOS Safari —
which ignores the meta and needs its non-standard `gesture*` events plus multi-touch `touchmove`
cancelled. Only `touchmove` is cancelled, never `touchstart`: cancelling `touchstart` suppresses
the pointer events the viewer runs on.

`AssetImgViewer` is the one place that zooms. It does **not** opt out of the above — it sets
`touch-action: none` and implements pinch, drag, double-tap, wheel and double-click itself from
pointer events, so mouse and touch share one code path. The image is laid out fitted and centred
(`absolute inset-0 m-auto` + `max-w/h-full`) with zoom as a transform on top, so scale 1 always
means "whole image visible"; `transform-origin` must stay at its default centre, because the
gesture maths works in container-centre-relative coordinates. Translation is clamped so the image
cannot be flung off screen. Give it a parent with a definite height (`min-h-0 flex-1`), not
content-sized.

**Android hides the Camera entry from a file picker whose `accept` is only `image/*`.** `NewAsset`
uses `accept="image/*,text/plain"` to get the full chooser back, and so has to reject non-images
in the change handler.

**Scoped `:has()` only.** `has-[button:active]` matches *any* descendant button — on a card with a
row menu that flashes the whole card. Target a marker instead:
`has-[[data-card-body]:active]`.

**Reuse display logic, don't copy it.** Status/format helpers shared between a desktop column and
a mobile card are exported from the column file: `ApiKeyStatusBadge`, `getApiKeyStatus`,
`TransactionTypeBadge`, `TransactionCodeBadge`, `accionMapping`, `calculateIcon`.

---

## Theming

Dark-only in practice — `index.html` hardcodes `class="dark"` (`next-themes` is installed but
unused). Colours are oklch CSS vars in `App.css`. Manifest colours must be plain CSS colours, so
`theme_color` is the hex equivalent (`#121113`).

`Custom.css` sets `html { font-size: 17px }` **only at ≥768px**. Every Tailwind rem is 6% larger on
desktop than on mobile; keep that scoped.

Card design that works: label *above* value, consistently. Mixing label-above-value with
label-beside-value in one card is what makes it look disorganised.

---

## PWA

`vite-plugin-pwa`, `registerType: prompt` + `injectRegister: null`. Icons in `public/` (192, 512,
maskable 512, apple touch). Maskable keeps the logo at ~59% of the canvas because launchers crop
to a shape.

### Updates reaching installed phones

This used to be broken, and the fix is split over three places — change one and the other two
stop making sense.

`src/lib/pwa.ts` owns registration and is the only caller of `virtual:pwa-register`. The plugin's
own injected `registerSW.js` was the bug: it is nothing but
`navigator.serviceWorker.register('/sw.js')`. It never reloads the document, so a new worker took
control while the running page went on executing the *old* JS modules already in memory — and an
installed PWA is resumed, not reloaded, for weeks.

Three things have to hold:

1. **The page must reload.** A service worker swap alone changes nothing for a document that is
   already running. `registerSW` from `virtual:pwa-register` wraps workbox-window and does the
   reload; the injected script does not. Never go back to `injectRegister: 'script'`/`'auto'`.
2. **Something has to check.** The browser only looks for a new `sw.js` on a real navigation (and
   at most once a day by itself). `pwa.ts` calls `registration.update()` every 30 min, on
   `visibilitychange` → visible, and on `online`, throttled to one check a minute.
3. **`prompt`, not `autoUpdate`.** Under `autoUpdate` the plugin forces `skipWaiting` +
   `clientsClaim`, so the new worker activates under the live page and `cleanupOutdatedCaches`
   deletes the chunks that page still lazy-loads — a route opened after that 404s. With `prompt`
   the new worker waits, the old caches stay valid, and we choose the moment: a Sonner toast with
   a Recargar action, or silently when the app is backgrounded (`visibilityState === 'hidden'`),
   so the next resume is already the new version.

Leaving `workbox.skipWaiting` unset is deliberate — that is what makes workbox emit the
`SKIP_WAITING` message listener that `applyUpdate()` posts to.

`public/serve.json` (copied to `dist/`, where `serve` reads it) sends `no-cache` for
`index.html`/`sw.js`/`manifest.webmanifest` and `immutable` for hashed `assets/**`. `serve` sends
no `Cache-Control` at all on its own, which leaves browsers applying heuristic freshness to
`index.html`.

Prod is Railway behind Cloudflare. Railway does not cache, but **Cloudflare caches `.js` by
extension under the default Cache Level: Standard**, and `/sw.js` is a `.js` file. A stale `sw.js`
at the edge stalls every update check for the whole edge TTL, and `updateViaCache` does not help —
it only bypasses the *browser's* HTTP cache, not Cloudflare's. The `no-cache` headers above are
what keep the edge honest; if the DNS record is proxied (orange cloud), also add a Cache Rule that
bypasses cache for `/sw.js`, `/index.html` and `/manifest.webmanifest`.

**Never add API responses to `runtimeCaching`.** TanStack Query owns response caching, and a
service-worker cache of authenticated responses outlives a logout and leaks across users. The
worker precaches the app shell only; its sole runtime route is the SPA navigation fallback.
Offline *data* is handled one layer up, in `src/api/persist.ts` — see below.

---

## Offline

Three layers, and all three are needed before the app is usable with no connection.

**1. The shell.** `globPatterns` precaches every chunk, not just the entry — ~1.5 MB, both
layouts, charts included — and `navigateFallback` serves `index.html` for any route. So every
screen loads offline. No remote fonts; nothing else to fetch.

**2. The data — `src/api/persist.ts`.** The query cache is persisted to IndexedDB and restored
through `PersistQueryClientProvider` in `main.tsx` (not `QueryClientProvider`; it holds queries
off until hydration lands, so a fetch cannot resolve first and overwrite what was restored).

- **IndexedDB, not localStorage**: localStorage is ~5 MB for the whole origin and zustand's
  `app-storage` already lives there, and a megabyte write is synchronous on the main thread.
- **Luxon must be tagged.** `useFood` puts real `DateTime` objects in the cache and
  `JSON.stringify` flattens them to ISO strings through their own `toJSON`, so a naive round-trip
  hands a hydrated screen a string and `.toFormat()` throws. `encodeDates`/`decodeDates` tag and
  rebuild them, reviving as `{ zone: 'utc' }` to match the hooks. **Any new query holding a
  non-JSON value needs the same treatment** — this is the trap to check first when a hydrated
  screen crashes and a fresh one does not.
- **Asset details are excluded** — `GET /assets/{id}` is the only response carrying a base64 image,
  and persisting those would re-serialise every photo opened on each save. List rows *are*
  persisted, so the screen fills in offline and only the image needs a connection.
- **Cleared at every session boundary**: login, logout and 401. That is what keeps one user's
  figures out of another's session, and it is why this is not in the service worker — a worker
  cache is keyed by URL, invisible to the app, and survives a logout.
- `buster: __BUILD_ID__` (defined in `vite.config.ts`) throws the cache away on every deploy, so a
  changed wire format can never be hydrated into the new build.
- `gcTime` is the real limit on what gets written — see `api/queryClient.ts`.

**3. The boot gate — `src/App.tsx`.** This was the blocker that made the other two pointless: any
failure of `/check-session` redirected to `/login`, which is the one screen an offline user cannot
get past — so a transient blip on mobile data logged you out with a perfectly good session.

It now boots **optimistically**: a stored `sessionId` is enough to render with, so it navigates to
`/dashboard` immediately and verifies behind the screen. Nothing is actually trusted — an invalid
session is a 401 from the API, and the interceptor in `api/client.ts` clears the session, drops the
persisted cache and redirects. Showing someone their own cached figures for a few hundred ms costs
nothing.

That ordering is the whole point: `/check-session` plus the two catalog fetches used to be three
sequential round-trips in front of the first paint, which on mobile data *is* the cold start. Now
they overlap with the dashboard's own queries. A non-401 answer (a sick backend) leaves the user in
the app rather than at a login screen they also cannot use; only *unreachable* raises the
"Sin conexión" toast. `navigator.onLine === false` short-circuits, and the call has an explicit 8 s
timeout — without one a captive portal leaves the promise pending for the life of the app.

**`RootComponent` holds the routes while `useIsRestoring()` is true.** Reading IndexedDB takes a
macrotask at minimum while the optimistic `navigate` is synchronous, so without that guard the
dashboard mounts first and paints a frame or two of **zeroes** before the restored figures land —
on a finance screen that reads as data loss, not as loading.

**Known gap: writes.** Query's default `networkMode: 'online'` *pauses* an offline mutation and
resumes it on reconnect, but only while the page lives — and mutations are deliberately not
persisted (`shouldDehydrateMutation: () => false`), because a replayed gasto is a silent
duplicate. So an offline save shows its dialog spinner until the connection returns. Making that
honest is a product decision: fail fast and tell the user, or build a real outbox.

`devOptions.enabled: false` — the worker is off in `vite dev` because it makes HMR confusing.
Verify PWA behaviour with `npm run preview`.

`maximumFileSizeToCacheInBytes` is raised to 4 MiB: the Recharts chunk (~300 kB, the largest in
the app) exceeds workbox's 2 MiB default and would be silently dropped from the precache.

---

## Gotchas

- **`tsc` is part of `npm run build`** with `noUnusedLocals`/`noUnusedParameters` on. A leftover
  import fails the build.
- **Charts are lazy and behind a tab on mobile**, so a phone only pays for Recharts when the
  Gráficos tab is opened. Keep it that way.
- **`openapi-typescript` is run via `npx`, not installed** — it peer-depends on TypeScript 5 and
  this repo is on 7. It only produces a committed artefact, so it needs no place in the tree.
- Remaining `npm audit` findings are all dev-only (`serve`, `@tailwindcss/vite`); none ship in the
  bundle. `npm audit fix --force` would downgrade `serve` 14 → 10 and break `npm start`.
- There is a **React Native app** at `../scpp-app-v2`. It is feature-behind and slated for
  retirement once the PWA has been used on a real device. Do not add features there.
