import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import {
  AuthResponseDto,
  LoginRequestDto
} from '../models/auth-response';

@Injectable({ providedIn: 'root' })
export class AuthService {

  private readonly API = environment.apiUrl;
  private readonly TOKEN_KEY = 'auth_token';
  private readonly USER_KEY  = 'auth_user';

  currentUser$ = new BehaviorSubject<AuthResponseDto | null>(this.loadUser());

  constructor(
    private http: HttpClient,
    private router: Router
  ) {}

  // ── Auth ──────────────────────────────────────────────────

  login(credentials: LoginRequestDto): Observable<AuthResponseDto> {
    return this.http
      .post<AuthResponseDto>(`${this.API}/auth/login`, credentials)
      .pipe(tap(res => this.saveSession(res)));
  }

  // ✅ register() supprimé — l'inscription se fait uniquement via Admin panel

  logout(): void {
    // ✅ Appel HTTP backend logout avant nettoyage local
    this.http.post(`${this.API}/auth/logout`, {}).subscribe({
      complete: () => this.clearSession(),
      error:    () => this.clearSession() // on nettoie même si le backend échoue
    });
  }

  // ── Token / session ───────────────────────────────────────

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
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
    localStorage.setItem(this.TOKEN_KEY, res.token);
    localStorage.setItem(this.USER_KEY, JSON.stringify(res));
    this.currentUser$.next(res);
  }

  private clearSession(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.currentUser$.next(null);
    this.router.navigate(['/auth/login']);
  }

  private loadUser(): AuthResponseDto | null {
    try {
      const raw = localStorage.getItem(this.USER_KEY);
      return raw ? (JSON.parse(raw) as AuthResponseDto) : null;
    } catch {
      return null;
    }
  }
}
