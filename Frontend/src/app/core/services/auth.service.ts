import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { AuthResponseDto, LoginRequestDto } from '../models/auth-response';

@Injectable({ providedIn: 'root' })
export class AuthService {

  private readonly API           = environment.apiUrl;
  private readonly TOKEN_KEY     = 'auth_token';
  private readonly REFRESH_KEY   = 'auth_refresh_token';
  private readonly USER_KEY      = 'auth_user';

  currentUser$ = new BehaviorSubject<AuthResponseDto | null>(this.loadUser());

  constructor(
    private http:   HttpClient,
    private router: Router
  ) {}

  // ── Auth ──────────────────────────────────────────────────

  login(credentials: LoginRequestDto): Observable<AuthResponseDto> {
    return this.http
      .post<AuthResponseDto>(`${this.API}/auth/login`, credentials)
      .pipe(tap(res => this.saveSession(res)));
  }

  refreshToken(): Observable<AuthResponseDto> {
    const refreshToken = this.getRefreshToken();
    return this.http
      .post<AuthResponseDto>(`${this.API}/auth/refresh`, { refreshToken })
      .pipe(tap(res => this.saveSession(res)));
  }

 logout(): void {
  const refreshToken = this.getRefreshToken();
  this.http.post(`${this.API}/auth/logout`, { refreshToken }).subscribe({
      complete: () => this.clearSession(),
      error:    () => this.clearSession()
    });
  }

  // ── Token / session ───────────────────────────────────────

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_KEY);
  }

  isLoggedIn(): boolean {
    const token = this.getToken();
    if (!token) return false;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp * 1000 > Date.now();
    } catch { return false; }
  }

  // ── Role helpers ──────────────────────────────────────────

  getRole(): string | null {
    return this.currentUser$.value?.role ?? null;
  }

  isAdmin(): boolean {
    return this.getRole() === 'Admin';
  }

  isAdminOrManager(): boolean {
    const role = this.getRole();
    return role === 'Admin' || role === 'Manager';
  }

  // ── Private ───────────────────────────────────────────────

  private saveSession(res: AuthResponseDto): void {
    localStorage.setItem(this.TOKEN_KEY,   res.token);
    localStorage.setItem(this.REFRESH_KEY, res.refreshToken);
    localStorage.setItem(this.USER_KEY,    JSON.stringify(res));
    this.currentUser$.next(res);
  }

  private clearSession(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.currentUser$.next(null);
    this.router.navigate(['/auth/login']);
  }

  private loadUser(): AuthResponseDto | null {
    try {
      const raw = localStorage.getItem(this.USER_KEY);
      return raw ? (JSON.parse(raw) as AuthResponseDto) : null;
    } catch { return null; }
  }
}