{/* cspell:disable */} 
import type { UserRole } from '@/features/auth/types'
export enum AppRouteId {
  Welcome = 'welcome',
  Auth = 'auth',
  ParentDashboard = 'parent-dashboard',
  ChildDashboard = 'child-dashboard',
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
    label: 'Добро пожаловать',
    layout: 'public',
    isPublic: true,
  },
  {
    id: AppRouteId.Auth,
    path: '/auth',
    label: 'Аутентификация',
    layout: 'public',
    isPublic: true,
  },
  {
    id: AppRouteId.ParentDashboard,
    path: '/dashboard/parent',
    label: 'Панель родителя',
    layout: 'app',
    requiredRoles: ['parent'],
  },
  {
    id: AppRouteId.ChildDashboard,
    path: '/dashboard/child',
    label: 'Панель ребёнка',
    layout: 'app',
    requiredRoles: ['child'],
  },
]

export const routeRecord = routes.reduce<Record<AppRouteId, RouteConfig>>((acc, route) => {
  // eslint-disable-next-line no-param-reassign
  acc[route.id] = route
  return acc
}, {} as Record<AppRouteId, RouteConfig>)
