import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, withComponentInputBinding, withViewTransitions } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { errorInterceptor } from './core/interceptors/error.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),

    // Router — withComponentInputBinding() maps route params to @Input() properties,
    // withViewTransitions() enables smooth page-to-page animations.
    provideRouter(routes, withComponentInputBinding(), withViewTransitions()),

    // HttpClient with functional interceptors (no class-based interceptors needed)
    provideHttpClient(withInterceptors([authInterceptor, errorInterceptor])),

    // Async animations keep the initial bundle small
    provideAnimationsAsync(),
  ],
};
