import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import {
  AuthResponseDto,
  LoginRequestDto,
  RegisterRequestDto
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

  register(payload: RegisterRequestDto): Observable<AuthResponseDto> {
    return this.http
      .post<AuthResponseDto>(`${this.API}/auth/register`, payload)
      .pipe(tap(res => this.saveSession(res)));
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.currentUser$.next(null);
    this.router.navigate(['/auth/login']);
  }

  // ── Token / session ───────────────────────────────────────

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
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

  private loadUser(): AuthResponseDto | null {
    try {
      const raw = localStorage.getItem(this.USER_KEY);
      return raw ? (JSON.parse(raw) as AuthResponseDto) : null;
    } catch {
      return null;
    }
  }
}
