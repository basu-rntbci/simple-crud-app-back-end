import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

/**
 * Attaches the JWT Bearer token to every outgoing API request.
 * Skips requests that already carry an Authorization header.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = inject(AuthService).token();

  if (token && !req.headers.has('Authorization')) {
    return next(
      req.clone({ headers: req.headers.set('Authorization', `Bearer ${token}`) }),
    );
  }

  return next(req);
};
