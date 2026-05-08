import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthResponseDto, LoginRequestDto } from '../models/auth-response';

@Injectable({ providedIn: 'root' })
export class AuthService {

  private readonly AUTH_USER_KEY = 'auth_user';
  private readonly TOKEN_KEY     = 'access_token';

  private currentUserSubject = new BehaviorSubject<AuthResponseDto | null>(
    this.loadFromStorage()
  );
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {}

  private normalizeRole(role: any): string {
    if (typeof role === 'string' && ['Admin','Manager','User'].includes(role)) return role;
    const map: Record<number, string> = { 0: 'Admin', 1: 'Manager', 2: 'User' };
    return map[role as number] ?? 'User';
  }

  private loadFromStorage(): AuthResponseDto | null {
    try {
      const stored = localStorage.getItem(this.AUTH_USER_KEY);
      if (!stored) return null;
      const parsed = JSON.parse(stored);
      parsed.role = this.normalizeRole(parsed.role);
      return parsed;
    } catch {
      return null;
    }
  }

  login(dto: LoginRequestDto): Observable<AuthResponseDto> {
    return this.http
      .post<AuthResponseDto>(`${environment.apiUrl}/auth/login`, dto)
      .pipe(
        tap(response => {
          response.role = this.normalizeRole(response.role);
          localStorage.setItem(this.TOKEN_KEY,     response.token);
          localStorage.setItem(this.AUTH_USER_KEY, JSON.stringify(response));
          this.currentUserSubject.next(response);
        })
      );
  }

logout(): void {
    localStorage.clear();
    this.currentUserSubject.next(null);
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  isLoggedIn(): boolean {
    const token = this.getToken();
    if (!token) return false;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp * 1000 > Date.now();
    } catch {
      return false;
    }
  }

  getCurrentUser(): AuthResponseDto | null {
    return this.currentUserSubject.value;
  }

  isAdmin(): boolean {
    return this.getCurrentUser()?.role === 'Admin';
  }

  isAdminOrManager(): boolean {
    const role = this.getCurrentUser()?.role;
    return role === 'Admin' || role === 'Manager';
  }
}