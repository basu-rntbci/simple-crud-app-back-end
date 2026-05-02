/** Credentials sent to POST /auth/login */
export interface LoginRequest {
  email: string;
  password: string;
}

/** Payload sent to POST /auth/register */
export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

/** Response returned from both login and register */
export interface AuthResponse {
  success: boolean;
  token: string;
}

/** Minimal user data cached in localStorage (derived from auth forms, not a /me endpoint) */
export interface StoredUser {
  name: string;
  email: string;
}
