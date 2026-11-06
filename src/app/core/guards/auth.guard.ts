import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { map, catchError, of } from 'rxjs';

/**
 * Protege rutas autenticadas (ej. /dashboard).
 * Si no hay token o la sesión no es válida, redirige a /login.
 */
export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const token = localStorage.getItem('token');
  if (!token) {
    authService.clearSession();
    return router.createUrlTree(['/login']);
  }

  // Verifica con el backend (autoridad real de la verdad)
  return authService.fetchProfile().pipe(
    map((user) => {
      if (user) {
        return true;
      }
      authService.clearSession();
      return router.createUrlTree(['/login']);
    }),
    catchError(() => {
      authService.clearSession();
      return of(router.createUrlTree(['/login']));
    })
  );
};

/**
 * Protege rutas de invitados (ej. /login, /register).
 * Si el usuario ya está autenticado con token válido, redirige al /dashboard.
 */
export const guestGuard: CanActivateFn = () => {
  const router = inject(Router);
  const token = localStorage.getItem('token');

  if (token) {
    return router.createUrlTree(['/dashboard']);
  }
  return true;
};
