{/* cspell:disable */} 
import type { UserRole } from '@/features/auth/types'
export enum AppRouteId {
  Welcome = 'welcome',
  Auth = 'auth',
  ParentDashboard = 'parent-dashboard',
  ChildDashboard = 'child-dashboard',
  TaskCreate = 'task-create',
  AiAssistant = 'ai-assistant',
}

export interface RouteConfig {
  id: AppRouteId
  path: string
  label: string
  layout: 'public' | 'app'
  requiredRoles?: UserRole[]
  isPublic?: boolean
}

export const routes: RouteConfig[] = [
  {
    id: AppRouteId.Welcome,
    path: '/',
    label: 'routes.welcome',
    layout: 'public',
    isPublic: true,
  },
  {
    id: AppRouteId.Auth,
    path: '/auth',
    label: 'routes.auth',
    layout: 'public',
    isPublic: true,
  },
  {
    id: AppRouteId.ParentDashboard,
    path: '/dashboard/parent',
    label: 'routes.parentDashboard',
    layout: 'app',
    requiredRoles: ['parent'],
  },
  {
    id: AppRouteId.ChildDashboard,
    path: '/dashboard/child',
    label: 'routes.childDashboard',
    layout: 'app',
    requiredRoles: ['child'],
  },
  {
    id: AppRouteId.TaskCreate,
    path: '/dashboard/tasks/new',
    label: 'routes.taskCreate',
    layout: 'app',
    requiredRoles: ['parent'],
  },
  {
    id: AppRouteId.AiAssistant,
    path: '/ai',
    label: 'routes.aiAssistant',
    layout: 'app',
    requiredRoles: ['parent', 'child'],
  },
]

export const routeRecord = routes.reduce<Record<AppRouteId, RouteConfig>>((acc, route) => {
  // eslint-disable-next-line no-param-reassign
  acc[route.id] = route
  return acc
}, {} as Record<AppRouteId, RouteConfig>)
