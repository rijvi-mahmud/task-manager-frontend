# Task Manager frontend

React application for shared workspaces and Kanban task boards. This guide covers
features, UI behavior, state ownership, API formats, source conventions, testing,
and deployment. The Spring Boot API lives in
[task-manager-backend](https://github.com/rijvi-mahmud/task-manager-backend).

## Technical specification

| Area | Implementation |
| --- | --- |
| Language/UI | TypeScript with strict checking; React 19 |
| Build tooling | Vite 8 and the React Vite plugin |
| Package manager | pnpm 11; `pnpm-lock.yaml` is the lockfile |
| Routing | TanStack Router; authenticated route guards and lazy-loaded board page |
| Server state | TanStack Query v5 |
| URL state | nuqs v2 with the TanStack Router adapter |
| Forms/validation | React Hook Form, Zod, `@hookform/resolvers` |
| Presentation | Tailwind CSS v4, shared UI primitives, Lucide icons |
| Drag/drop | dnd-kit with pointer and keyboard interactions |
| HTTP | Typed fetch client with cancellation, deadline, CSRF and response validation |
| Tests/lint | Vitest, Testing Library, jsdom, Oxlint |

[package.json](package.json) declares dependency ranges and commands; the pnpm
lockfile pins installed versions. No Redux/Zustand store or additional HTTP client
library is used.

## Features covered

| Feature | User-facing behavior |
| --- | --- |
| Account access | Register, sign in, sign out, and return to a protected route after sign-in |
| Password recovery | Request a log-only reset link, choose/confirm a new password, show confirmed completion |
| Session handling | Observe the current user, recheck on focus, clear private query data when identity changes |
| Workspaces | Switch boards, reopen the last-used board when available, create a workspace |
| Workspace settings | Rename/delete as owner; leave as member; backend protects the last owner |
| Team management | List members and pending invitations; owners add/remove people by email |
| Kanban workflow | To do, In progress, Done; drag/drop or edit status through the form |
| Task management | Create/edit/delete, priorities, optional descriptions/due dates, assignment/unassignment |
| Quick add | Open a new task with the selected column's status preselected |
| Filtering | Search, priority, assignee/unassigned, due-date range, sort, removable filter chips, reset |
| Pagination | Independent Load more per column, with server-provided counts |
| Statistics | Total/status/overdue counts across the workspace, independent of filters |
| Concurrent edits | Show conflict feedback and offer the latest server version |
| Recovery | Inline query errors/retry, mutation feedback, loading states, empty states, error boundary |
| Responsive UI | Neutral black/white/gray primary palette, system dark theme, responsive forms/dialogs/board |
| Accessibility | Semantic landmarks, labels/errors, keyboard controls, native dialogs, announcements, visible focus |

Email delivery, email verification, MFA, social login, push updates, and custom
ordering inside a task column are outside the configured project scope.

## Setup and commands

Requirements: Node.js 22+, pnpm 11, and the backend running at
`http://localhost:8080`. From `frontend`:

```sh
pnpm install --frozen-lockfile
pnpm dev
```

Open `http://localhost:5173`. Vite proxies `/api` to the backend. Browser requests
therefore stay on the frontend origin and can use the session and CSRF cookies.
There are no required frontend environment variables in the current setup.

| Command | Purpose |
| --- | --- |
| `pnpm dev` | Development server with hot reload |
| `pnpm test` | Run all Vitest tests |
| `pnpm test --maxWorkers=2` | Run with lower worker concurrency |
| `pnpm test:watch` | Interactive test watch mode |
| `pnpm lint` | Oxlint checks |
| `pnpm build` | TypeScript project checking and Vite production build |
| `pnpm preview` | Preview the built assets locally |

Do not introduce npm/yarn lockfiles. Dependencies belong in `package.json` and
`pnpm-lock.yaml`; avoid editing the lockfile manually.

## Source structure

```text
src/
├── app/                    Providers, router, shell, QueryClient, app error boundary
├── api/                    Shared fetch client, API version, mutation invalidation
├── components/ui/          Reusable controls, dialogs, alerts, badges, empty states
├── config/                 Shared request and query policy
├── hooks/                  Feature-independent reusable hooks
├── utils/                  Pure date, class-name and form-error helpers
├── features/
│   ├── auth/               Schemas, API/query options, session lifecycle, forms/pages
│   ├── workspaces/         Workspace API/options, hooks, switcher/settings/pages
│   ├── members/            Membership schemas, API/options, hooks and components
│   └── tasks/              Task schemas, API/options, hooks, board/forms/filters/utils
├── test/                   Fixtures, query wrappers, setup, cross-feature regressions
├── index.css               Tailwind import, design tokens and global styles
└── main.tsx                React root and provider composition
```

Keep hooks with their feature until they are reusable without that feature's API.
Shared hooks belong in `src/hooks`; pure functions belong in `utils` and do not
call React hooks. Tests normally sit beside their subject with `.test.ts` or
`.test.tsx`; cross-feature scenarios live in `src/test`.

## Routing and permissions

| Route | Behavior |
| --- | --- |
| `/login` | Sign in; signed-in visitors redirect into the application |
| `/register` | Register/claim invitation; signed-in visitors redirect |
| `/forgot-password` | Request a reset link written to the backend log |
| `/reset-password?token=...` | Reset form; also reachable while another account is signed in |
| `/` | Protected; opens the last-used accessible workspace or first workspace; otherwise shows workspace creation |
| `/workspaces/{workspaceId}` | Protected workspace board; numeric positive safe-integer route parameter |
| Unmatched path | Not-found presentation |

Route guards use the session query and preserve an internal return target for
sign-in. The backend remains authoritative for permissions. Owners manage the
workspace and members; members work on tasks and can leave. Task deletion is shown
for the creator or an owner. Hiding a control is presentation, not authorization.

## State ownership and fetching

| State | Owner | Examples |
| --- | --- | --- |
| Server data | TanStack Query | Session, workspaces, members, task pages, statistics |
| Shareable view state | nuqs URL parameters | Search, priority, assignee, sort, due-date range |
| Form state | React Hook Form | Values, validation, submission errors |
| Transient UI state | Local React state | Open dialogs, edit session, active drag |
| Last workspace preference | Local storage helper | Preferred initial board when still accessible |

There is no duplicate global server-data store. Effects synchronize external
systems such as router invalidation and dialog/focus behavior; query fetching is
expressed through TanStack Query options and hooks.

`app/queryClient.ts` creates one client per app, with isolated instances in tests.
The default query stale time is 10 seconds, refresh interval 15 seconds, and retries
are disabled. Queries use `networkMode: 'always'` to support a local backend even
when the browser reports offline. Normal Query behavior handles visibility/focus,
request deduplication, caching, and cancellation through the supplied AbortSignal.

On a full reload, the app waits for the first session result before mounting
protected route loaders. Both this phase and subsequent route loading show
`AppLoadingSkeleton`; the router uses zero-delay pending presentation. Initial
identity resolution does not invalidate/cancel the route being loaded. Later
confirmed identity changes still invalidate router state. Real session/route API
failures render `AppLoadError` with retry/reload controls, while rendering bugs
belong to the outer error boundary.

The session query uses a five-minute stale time, has no interval polling, and
always rechecks on focus. A `401` from another operation invalidates the session
query with `cancelRefetch: false`; overlapping failures share its pending request.
Only `/auth/me` confirms whether the current account is signed out. A delayed
failure from an earlier account therefore does not clear a newer account's session.

Confirmed login/logout cancels older session reads before updating session data.
An identity change cancels/removes private queries, clears tracked mutations, and
keys the signed-in UI by user ID. Clearing mutation tracking does not cancel a
server-side write already in progress; its later failure is reconciled through the
current session endpoint.

### Query keys, pagination and mutations

Task keys include workspace ID, normalized filters, status and query purpose.
Members and workspace queries have their own key factories. Each task column uses
`useInfiniteQuery`, starts at page zero and requests 20 tasks. `getNextPageParam`
uses the API's page metadata. Changing filters selects another query key, so
pagination belongs to that view and a still-fresh cached view can be reused.

Writes use native mutation status and invalidate affected query keys. Task writes
invalidate that workspace's task data/statistics; adding a member refreshes the
team/workspace count; removing one also refreshes tasks because assignments change.
Overlapping application writes batch revalidation through the shared helper.
Confirmed workspace deletion/leaving removes it from the local workspace list and
discards its cached board/member queries.

Task ordering and filtered results come from the backend. There are no optimistic
column snapshots or hand-patched task lists. Cached data can remain visible with a
refresh error; retry reconciles it. Displayed cards are deduplicated because an
offset-paginated board may change while more pages are loading.

## Team collaboration and cross-tab updates

Workspaces are shared server resources: members of the same workspace read and
write the same board. Collaboration currently uses HTTP polling through TanStack
Query, with a 15-second interval for observed task, statistics, member and workspace
queries. A successful write revalidates affected queries in the initiating tab;
other clients discover the committed change on a later fetch.

| Scenario | Current behavior |
| --- | --- |
| Another teammate creates/edits/moves a task | An active board picks it up on its next successful refresh |
| Two tabs show the same workspace | Each tab has its own QueryClient and polls independently |
| Return to a hidden tab | Stale observed queries refetch on visibility/focus; the session always rechecks |
| Sign in/out in another tab of the same browser profile | Cookies are shared; the other tab discovers the current identity through `/auth/me` on focus or after a protected-request `401` |
| Different accounts at the same time | Use separate browser profiles or a normal/private window; ordinary same-profile tabs share the session cookie |
| Concurrent full task edits | The backend rejects a stale version with `409`; the form offers the latest version |
| A member loses access | The next protected request is rejected; workspace-list refresh removes unavailable workspaces |

These are near-real-time updates, not an immediate delivery guarantee: request
latency, failures, hidden tabs, and throttling can delay visible changes. Interval
polling is not configured to run in hidden tabs. Query cancellation and request
deduplication apply within each tab; there is no shared cross-tab query cache,
`BroadcastChannel` synchronization, WebSocket, or SSE stream.

For a manual collaboration check, sign in with two accounts in separate browser
profiles, add one account to the other's workspace, and edit the same board. Verify
that the second client sees task/member changes after refresh, stale full edits
return a conflict, and sign-out is detected when returning to another tab in the
same profile. Browser-level cross-tab/cookie behavior still needs an actual browser
check; jsdom unit tests do not establish it.

## URL filter specification

nuqs uses `nuqs/adapters/tanstack-router`, typed parsers and batched updates.
Defaults are omitted from the URL. Search requests use a 300 ms debounced value;
form controls remain responsive while the backend performs the actual search.

| URL parameter | Format/default | Backend mapping |
| --- | --- | --- |
| `q` | Search text; empty | Trimmed `q`; omitted when empty |
| `priority` | `LOW`, `MEDIUM`, `HIGH`; `ALL` | `priority`, or omitted |
| `assignee` | Positive safe-integer ID, `UNASSIGNED`; `ALL` | `assigneeId`, `unassigned=true`, or omitted |
| `sort` | `newest`, `dueDate`, `priority`; `newest` | `NEWEST`, `DUE_DATE`, `PRIORITY` |
| `dueFrom` | `yyyy-MM-dd`; empty | Inclusive lower calendar-date bound |
| `dueTo` | `yyyy-MM-dd`; empty | Inclusive upper calendar-date bound |

Example:

```text
/workspaces/1?q=release&priority=HIGH&assignee=UNASSIGNED&sort=dueDate&dueFrom=2026-01-01&dueTo=2026-01-31
```

The board adds its column status, page and size to API requests. Invalid enum/ID/date
URL values fall back to defaults. A reversed date range stays visible with an
associated error and disables column queries until corrected. Dates remain
calendar strings rather than UTC timestamps, with years 0001–9999. Either bound
can be open; undated tasks are excluded when a bound is set. Reset removes filter
parameters while preserving unrelated URL parameters. Statistics remain unfiltered.

## API transport and JSON formats

`api/apiClient.ts` pins `/api/v1`. Feature API classes provide typed calls;
`HttpClient` handles transport and runtime response validation centrally.

| Concern | Contract |
| --- | --- |
| Credentials | `credentials: 'same-origin'`; browser manages the HttpOnly session cookie |
| CSRF | Unsafe methods echo `XSRF-TOKEN` in `X-XSRF-TOKEN`; bootstrap through `/auth/csrf` when absent |
| Deadline | 30 seconds covering headers/body consumption; caller cancellation propagates |
| Request bodies | JSON with concrete domain inputs or generic JSON-safe types |
| Success JSON | `{data, meta: {requestId, timestamp}}`; client validates and unwraps `data` |
| Empty responses | Acknowledgement methods accept bodyless `202`/`204` |
| Errors | RFC 9457 `application/problem+json` mapped to `ApiError` |
| Error details | HTTP `status`, message, `fieldErrors`, optional `requestId` |
| Failed write timeout | Warns the change may already have been saved; no automatic write retry |

Example transport response:

```json
{
  "data": {
    "items": [],
    "page": 0,
    "size": 20,
    "totalItems": 0,
    "totalPages": 0
  },
  "meta": { "requestId": "request-123", "timestamp": "2026-11-15T12:00:00Z" }
}
```

Feature code receives the page inside `data`, not the envelope. A validation error
can return `{"status":400,"detail":"Validation failed","errors":{"title":"Title is required"}}`
with the standard problem metadata. Forms map those field errors onto inputs and
focus the first affected control. Unknown server failures use a generic message;
request IDs support matching them to backend logs.

Zod response schemas keep IDs/versions numeric, enum values explicit, nullable
fields explicit, date-only values separate from instants, and form input/output
transformations typed. New passwords use the backend's eight-code-point minimum
and 72-byte UTF-8 cap. Workspace/display names are capped at 80, task titles at
120, descriptions at 1000, and emails at 120 characters.

## UI, accessibility, feedback and recovery

Primary/secondary colors use black, white and neutral grays, with system light/dark
themes and no gradients. Status/error/warning colors carry semantic meaning.
Shared controls own focus styling, disabled states, sizing and select-arrow layout.

Use semantic header/nav/main landmarks, headings, task lists, definition lists,
labels and dates. The skip link targets the main landmark. Filters have a
fieldset/legend. Required fields expose `required`; validation connects
`aria-invalid` and `aria-describedby`. Editing status is the keyboard/pointer
alternative to dragging. Drag/drop has keyboard support and live announcements;
the visual overlay is hidden from assistive technology.

Native dialogs provide modal behavior and Escape handling. Confirmation dialogs
identify their message and focus Cancel. Removed member controls restore focus
appropriately. Dialog content scrolls within the viewport. Controls account for
reduced motion, forced colors and visible focus. Automated contrast tests check
design tokens, not browser-rendered pixels.

`Alert` supports error, warning, success and informational feedback. Errors use an
assertive alert; other feedback uses a polite status. Query/mutation loading and
saving feedback use live regions. Success is based on confirmed mutation results,
with reset/dismiss behavior. Failed sign-out preserves the session and displays a
retryable error. A successful password reset remains successful when the following
session refresh fails; its confirmation links back to sign-in.

`app/AppErrorBoundary.tsx` wraps providers/application rendering, logs diagnostics,
focuses a recovery heading, and offers retry/reload. Event-handler and ordinary
asynchronous failures belong to the operation's form/query/mutation UI. Router
loading failures also use router error handling. Browser testing with zoom, real
keyboard interaction and assistive technology is still required before claiming
WCAG conformance.

## Naming and implementation conventions

- PascalCase for components/types and component filenames; camelCase for other
  TypeScript modules, functions and variables; `use` prefix for hooks.
- UPPER_SNAKE_CASE for standalone constants; `is`, `has`, or `can` for predicates.
- Query-key factories use names such as `taskQueryKeys` and `memberQueryKeys`.
- Shared policy belongs in `config/appConfig.ts`; task labels, page size and debounce
  belong in `features/tasks/constants.ts`.
- Prefer inferred or concrete types and generics. Do not declare `any`, `unknown`,
  or `never` as application types or use double assertions to evade validation.
- Keep hooks focused on state/lifecycles, utilities pure, feature API calls in API
  modules, and reusable visual controls in `components/ui`.
- Use TanStack Query for server lifecycles and nuqs for URL state. Do not copy query
  results into local state or create effects solely to fetch them.

## Verification and deployment

From `frontend`:

```sh
pnpm test --maxWorkers=2
pnpm lint
pnpm build
```

Tests cover transport/cancellation/CSRF, schema and calendar validation, URL filters,
query pagination and mutation reconciliation, session changes, forms, permissions,
feedback, dialogs, and design-token contrast. jsdom tests do not verify real browser
cookie policy, visual layout, actual PostgreSQL behavior, or full accessibility.
The session suite includes delayed old-account failures and deduplicated `/me`
revalidation. The production build may report the existing main-chunk size warning;
that warning is separate from a TypeScript/build failure.

Deploy `dist` to a static host with an SPA fallback to `index.html` for application
routes, and reverse-proxy `/api` to the backend before that fallback. Use HTTPS and
secure backend cookies. The production host must provide the API proxy: Vite's dev
proxy is not part of the build. Keep frontend/backend on the same origin; changing
only CORS does not change the current client's `same-origin` credential policy.
`pnpm preview` is for local preview, not the production reverse-proxy setup.

## Official references

- [React effects](https://react.dev/learn/synchronizing-with-effects)
- [TanStack Query cancellation](https://tanstack.com/query/latest/docs/framework/react/guides/query-cancellation)
- [TanStack Query invalidation](https://tanstack.com/query/latest/docs/framework/react/guides/query-invalidation)
- [TanStack Query infinite queries](https://tanstack.com/query/latest/docs/framework/react/guides/infinite-queries)
- [TanStack Router authenticated routes](https://tanstack.com/router/latest/docs/guide/authenticated-routes)
- [nuqs adapters](https://nuqs.dev/docs/adapters)
- [React Hook Form resolvers](https://github.com/react-hook-form/resolvers)
- [Zod parsing](https://zod.dev/basics)
- [Vite server proxy](https://vite.dev/config/server-options.html#server-proxy)
- [WAI modal dialogs](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/)
