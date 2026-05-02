import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

/**
 * Global HTTP error handler.
 * 401 responses force logout so the user is redirected to the login page —
 * this covers both "never authenticated" and "token expired" scenarios.
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);

  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status === 401) {
        authService.logout();
      }
      // Propagate the error so individual components can show specific messages
      return throwError(() => err);
    }),
  );
};
