import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { guestGuard } from './core/guards/guest.guard';

export const routes: Routes = [
  // Default redirect
  { path: '', redirectTo: '/products', pathMatch: 'full' },

  // Auth routes — only accessible when NOT logged in
  {
    path: 'auth',
    canActivate: [guestGuard],
    children: [
      {
        path: 'login',
        loadComponent: () =>
          import('./features/auth/login/login').then((m) => m.LoginComponent),
      },
      {
        path: 'register',
        loadComponent: () =>
          import('./features/auth/register/register').then((m) => m.RegisterComponent),
      },
      { path: '', redirectTo: 'login', pathMatch: 'full' },
    ],
  },

  // Product routes — protected behind authGuard
  {
    path: 'products',
    canActivate: [authGuard],
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/products/product-list/product-list').then(
            (m) => m.ProductListComponent,
          ),
      },
      {
        path: 'new',
        loadComponent: () =>
          import('./features/products/product-form/product-form').then(
            (m) => m.ProductFormComponent,
          ),
      },
      {
        // :id is bound to ProductFormComponent.id via withComponentInputBinding()
        path: ':id/edit',
        loadComponent: () =>
          import('./features/products/product-form/product-form').then(
            (m) => m.ProductFormComponent,
          ),
      },
      {
        path: ':id',
        loadComponent: () =>
          import('./features/products/product-detail/product-detail').then(
            (m) => m.ProductDetailComponent,
          ),
      },
    ],
  },

  // Catch-all
  { path: '**', redirectTo: '/products' },
];
