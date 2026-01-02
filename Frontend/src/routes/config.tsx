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
  {
    id: AppRouteId.TaskCreate,
    path: '/dashboard/tasks/new',
    label: 'Создать задачу',
    layout: 'app',
    requiredRoles: ['parent'],
  },
  {
    id: AppRouteId.AiAssistant,
    path: '/ai',
    label: 'AI ассистент',
    layout: 'app',
    requiredRoles: ['parent', 'child'],
  },
]

export const routeRecord = routes.reduce<Record<AppRouteId, RouteConfig>>((acc, route) => {
  // eslint-disable-next-line no-param-reassign
  acc[route.id] = route
  return acc
}, {} as Record<AppRouteId, RouteConfig>)
