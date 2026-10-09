import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

import { SKIP_AUTH } from '../services/api.service';
import { AuthService } from './auth.service';
import { TokenStorage } from './token-storage.service';

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  if (request.context.get(SKIP_AUTH)) {
    return next(request);
  }

  const tokenStorage = inject(TokenStorage);
  const token = tokenStorage.getToken();
  if (!token) {
    return next(request);
  }

  const auth = inject(AuthService);
  const router = inject(Router);

  return next(request.clone({
    setHeaders: { Authorization: `Bearer ${token}` }
  })).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse && error.status === 401) {
        auth.logout();
        if (!router.url.startsWith('/login')) {
          void router.navigate(['/login']);
        }
      }

      return throwError(() => error);
    })
  );
};
