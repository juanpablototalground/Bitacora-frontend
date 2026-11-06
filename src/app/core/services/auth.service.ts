import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, map, catchError, of } from 'rxjs';
import { API_BASE_URL } from '../api.config';

export interface User {
  id: number;
  nombre: string;
  correo: string;
  area: string;
  isAdmin: boolean;
}

export interface RegisterPayload {
  nombre: string;
  correo: string;
  contrasena: string;
  area: string;
  isAdmin?: boolean;
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  user?: User;
  errors?: Record<string, string[]>;
  authorization?: {
    access_token: string;
    token_type: string;
    expires_in: number;
  };
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly apiUrl = `${API_BASE_URL}/auth`;
  private currentUserSignal = signal<User | null>(this.getStoredUser());

  readonly currentUser = computed(() => this.currentUserSignal());
  readonly isAuthenticated = computed(() => !!this.currentUserSignal());

  constructor(private http: HttpClient) {}

  login(credentials: { correo: string; contrasena: string }): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, credentials).pipe(
      tap((res) => {
        if (res.success && res.authorization?.access_token && res.user) {
          this.saveSession(res.authorization.access_token, res.user);
        }
      })
    );
  }

  register(payload: RegisterPayload): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/register`, payload).pipe(
      tap((res) => {
        if (res.success && res.authorization?.access_token && res.user) {
          this.saveSession(res.authorization.access_token, res.user);
        }
      })
    );
  }

  fetchProfile(): Observable<User | null> {
    const token = localStorage.getItem('token');
    if (!token) {
      this.clearSession();
      return of(null);
    }

    return this.http.get<{ success: boolean; user: User }>(`${this.apiUrl}/profile`).pipe(
      map((res) => {
        if (res.success && res.user) {
          // Re-sincroniza con los datos reales e inmutables del servidor
          this.saveSession(token, res.user);
          return res.user;
        }
        this.clearSession();
        return null;
      }),
      catchError(() => {
        this.clearSession();
        return of(null);
      })
    );
  }

  logout(): Observable<any> {
    return this.http.post(`${this.apiUrl}/logout`, {}).pipe(
      tap(() => {
        this.clearSession();
      })
    );
  }

  private saveSession(token: string, user: User): void {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    this.currentUserSignal.set(user);
  }

  clearSession(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.currentUserSignal.set(null);
  }

  private getStoredUser(): User | null {
    const raw = localStorage.getItem('user');
    try {
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }
}
