import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  StoredUser,
} from '../models/auth.model';

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  // Signal-based reactive state — no Subject/BehaviorSubject needed
  private readonly _token = signal<string | null>(localStorage.getItem(TOKEN_KEY));
  private readonly _user = signal<StoredUser | null>(
    JSON.parse(localStorage.getItem(USER_KEY) ?? 'null'),
  );

  /** True while the user holds a valid (non-expired) token stored in localStorage. */
  readonly isAuthenticated = computed(() => !!this._token());
  readonly token = this._token.asReadonly();
  readonly currentUser = this._user.asReadonly();

  /** Authenticate with email + password. Returns Observable<AuthResponse>. */
  login(credentials: LoginRequest) {
    return this.http
      .post<AuthResponse>(`${environment.apiUrl}/auth/login`, credentials)
      .pipe(
        tap((res) => {
          this.storeToken(res.token);
          // Derive a display name from the email since /login returns no user object
          this.storeUser({
            name: credentials.email.split('@')[0],
            email: credentials.email,
          });
        }),
      );
  }

  /** Create a new account. Returns Observable<AuthResponse>. */
  register(data: RegisterRequest) {
    return this.http
      .post<AuthResponse>(`${environment.apiUrl}/auth/register`, data)
      .pipe(
        tap((res) => {
          this.storeToken(res.token);
          this.storeUser({ name: data.name, email: data.email });
        }),
      );
  }

  /** Clear all auth state and redirect to login. */
  logout() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this._token.set(null);
    this._user.set(null);
    this.router.navigate(['/auth/login']);
  }

  private storeToken(token: string) {
    localStorage.setItem(TOKEN_KEY, token);
    this._token.set(token);
  }

  private storeUser(user: StoredUser) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    this._user.set(user);
  }
}
