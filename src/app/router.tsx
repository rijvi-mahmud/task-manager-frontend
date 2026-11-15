import type { QueryClient } from '@tanstack/react-query'
import {
  createRootRouteWithContext,
  createRoute,
  createRouter,
  lazyRouteComponent,
  notFound,
  Outlet,
  redirect,
} from '@tanstack/react-router'
import { NuqsAdapter } from 'nuqs/adapters/tanstack-router'
import { z } from 'zod'
import { sessionQueryOptions } from '../features/auth/api/authQueries'
import { safeRedirect } from '../features/auth/authSchemas'
import { ForgotPasswordPage } from '../features/auth/pages/ForgotPasswordPage'
import { LoginPage } from '../features/auth/pages/LoginPage'
import { RegisterPage } from '../features/auth/pages/RegisterPage'
import { ResetPasswordPage } from '../features/auth/pages/ResetPasswordPage'
import { workspacesQueryOptions } from '../features/workspaces/api/workspaceQueries'
import { lastWorkspaceId } from '../features/workspaces/lastWorkspace'
import { NoWorkspacePage } from '../features/workspaces/pages/NoWorkspacePage'
import { AppShell } from './AppShell'
import { AppLoadingSkeleton } from './AppLoadingSkeleton'
import { RouteLoadError } from './RouteLoadError'
import { NotFoundPage } from './NotFoundPage'

export interface RouterContext {
  queryClient: QueryClient
}

const rootRoute = createRootRouteWithContext<RouterContext>()({
  component: () => (
    <NuqsAdapter>
      <Outlet />
    </NuqsAdapter>
  ),
  notFoundComponent: NotFoundPage,
})

// --- Signed-out pages: a signed-in visitor is sent on to the app. ---

const guestSearch = z.object({ redirect: z.string().optional() })

async function redirectIfSignedIn(queryClient: QueryClient, target?: string) {
  if (await queryClient.fetchQuery(sessionQueryOptions)) {
    throw redirect({ href: safeRedirect(target) })
  }
}

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  validateSearch: guestSearch.extend({ reset: z.boolean().optional() }),
  beforeLoad: ({ context, search }) => redirectIfSignedIn(context.queryClient, search.redirect),
  component: LoginPage,
})

const registerRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/register',
  validateSearch: guestSearch,
  beforeLoad: ({ context, search }) => redirectIfSignedIn(context.queryClient, search.redirect),
  component: RegisterPage,
})

const forgotPasswordRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/forgot-password',
  beforeLoad: ({ context }) => redirectIfSignedIn(context.queryClient),
  component: ForgotPasswordPage,
})

/** Reachable while signed in too: a reset link may be opened in any tab. */
const resetPasswordRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/reset-password',
  validateSearch: z.object({ token: z.string().catch('') }),
  component: ResetPasswordPage,
})

// --- Signed-in app. ---

const appRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: 'app',
  beforeLoad: async ({ context, location }) => {
    if (!(await context.queryClient.fetchQuery(sessionQueryOptions))) {
      throw redirect({ to: '/login', search: { redirect: location.href } })
    }
  },
  component: AppShell,
})

/** Opens the last used workspace, or the first one. */
const homeRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/',
  loader: async ({ context }) => {
    const workspaces = await context.queryClient.ensureQueryData(workspacesQueryOptions)
    const last = lastWorkspaceId()
    const target = workspaces.find(workspace => workspace.id === last) ?? workspaces[0]
    if (target) throw redirect({ to: '/workspaces/$workspaceId', params: { workspaceId: target.id } })
  },
  component: NoWorkspacePage,
})

const workspaceRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/workspaces/$workspaceId',
  params: {
    parse: ({ workspaceId }) => {
      const id = Number(workspaceId)
      if (!Number.isSafeInteger(id) || id <= 0) throw notFound()
      return { workspaceId: id }
    },
    stringify: ({ workspaceId }) => ({ workspaceId: String(workspaceId) }),
  },
  loader: ({ context }) => context.queryClient.ensureQueryData(workspacesQueryOptions),
  // The board (drag and drop, forms) loads in its own chunk, after sign-in.
  component: lazyRouteComponent(() => import('../features/workspaces/pages/WorkspacePage'), 'WorkspacePage'),
})

const routeTree = rootRoute.addChildren([
  loginRoute,
  registerRoute,
  forgotPasswordRoute,
  resetPasswordRoute,
  appRoute.addChildren([homeRoute, workspaceRoute]),
])

export function createAppRouter(queryClient: QueryClient) {
  return createRouter({
    routeTree,
    context: { queryClient },
    defaultPreload: 'intent',
    defaultPendingComponent: AppLoadingSkeleton,
    defaultPendingMs: 0,
    defaultPendingMinMs: 0,
    defaultErrorComponent: RouteLoadError,
    // TanStack Query owns caching; loaders only make sure data is there.
    defaultPreloadStaleTime: 0,
    scrollRestoration: true,
  })
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof createAppRouter>
  }
}

