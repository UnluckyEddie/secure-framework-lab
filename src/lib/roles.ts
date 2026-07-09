import type { Role } from './types';

// CLASE: mapa de autorización por roles — define qué rutas puede visitar cada rol
export const ROUTE_PERMISSIONS: Record<string, Role[]> = {
  '/dashboard': ['ADMIN', 'TEACHER', 'STUDENT'],
  '/admin': ['ADMIN', 'STUDENT'],
  '/admin/logs': ['ADMIN'],
  '/reports': ['ADMIN', 'TEACHER'],
  '/profile': ['ADMIN', 'TEACHER', 'STUDENT'],
  '/lesson-guide': ['ADMIN', 'TEACHER', 'STUDENT'],
  '/security-status': ['ADMIN', 'TEACHER', 'STUDENT'],
};

export const API_PERMISSIONS: Record<string, Role[]> = {
  '/api/profile': ['ADMIN', 'TEACHER', 'STUDENT'],
  '/api/admin/users': ['ADMIN'],
  '/api/admin/logs': ['ADMIN'],
};

export const PUBLIC_ROUTES = ['/', '/login', '/unauthorized', '/register'];

export function getAllowedRoutesForRole(role: Role): string[] {
  return Object.entries(ROUTE_PERMISSIONS)
    .filter(([, roles]) => roles.includes(role))
    .map(([route]) => route);
}

export function isRouteAllowed(pathname: string, role: Role): boolean {
  const normalized = normalizePath(pathname);
  const allowedRoles = ROUTE_PERMISSIONS[normalized];
  if (!allowedRoles) return true;
  return allowedRoles.includes(role);
}

export function isApiAllowed(pathname: string, role: Role): boolean {
  const normalized = normalizePath(pathname);
  const allowedRoles = API_PERMISSIONS[normalized];
  if (!allowedRoles) return true;
  return allowedRoles.includes(role);
}

function normalizePath(pathname: string): string {
  return pathname.replace(/\/$/, '') || '/';
}

export function getRoleLabel(role: Role): string {
  const labels: Record<Role, string> = {
    ADMIN: 'Administrador',
    TEACHER: 'Profesor',
    STUDENT: 'Estudiante',
  };
  return labels[role];
}
