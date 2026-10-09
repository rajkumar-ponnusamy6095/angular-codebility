import { inject } from '@angular/core';
import { Routes } from '@angular/router';

import { AppLayout } from './core/layout/app-layout/app-layout';
import { authGuard } from './core/auth/auth.guard';
import { AuthService } from './core/auth/auth.service';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: () => inject(AuthService).isAuthenticated ? '/dashboard' : '/login',
  },

  // Public routes
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login').then((m) => m.Login),
  },
  {
    path: 'register',
    loadComponent: () => import('./pages/register/register').then((m) => m.Register),
  },
  {
    path: 'forgot-password',
    loadComponent: () =>
      import('./pages/forgot-password/forgot-password').then((m) => m.ForgotPassword),
  },
  {
    path: 'account/reset-password',
    loadComponent: () =>
      import('./pages/reset-password/reset-password').then((m) => m.ResetPassword),
  },
  {
    path: 'account/verify-email',
    loadComponent: () => import('./pages/verify-email/verify-email').then((m) => m.VerifyEmail),
  },

  // Authenticated application layout
  {
    path: '',
    component: AppLayout,
    canActivate: [authGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./pages/dashboard/dashboard').then((m) => m.Dashboard),
      },

      {
        path: 'users',
        children: [
          {
            path: '',
            loadComponent: () => import('./pages/users/users').then((m) => m.Users),
          },
          {
            path: 'create',
            loadComponent: () =>
              import('./pages/users/user-form/user-form').then((m) => m.UserForm),
          },
          {
            path: ':id/edit',
            loadComponent: () =>
              import('./pages/users/user-form/user-form').then((m) => m.UserForm),
          },
        ],
      },

      {
        path: 'profile',
        loadComponent: () => import('./pages/profile/profile').then((m) => m.Profile),
      },
    ],
  },

  // Not-found page
  {
    path: '400',
    loadComponent: () => import('./pages/errors/bad-request/bad-request').then((m) => m.BadRequest),
  },
  {
    path: '401',
    loadComponent: () =>
      import('./pages/errors/unauthorized/unauthorized').then((m) => m.Unauthorized),
  },
  {
    path: '403',
    loadComponent: () => import('./pages/errors/forbidden/forbidden').then((m) => m.Forbidden),
  },
  {
    path: '500',
    loadComponent: () =>
      import('./pages/errors/server-error/server-error').then((m) => m.ServerError),
  },
  {
    path: '404',
    loadComponent: () => import('./pages/errors/not-found/not-found').then((m) => m.NotFound),
  },
  {
    path: '**',
    redirectTo: '404',
  },
];
