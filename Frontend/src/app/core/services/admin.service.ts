import { tap, map } from 'rxjs/operators';
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  AdminStatsDto, ActivityItemDto, ExportReportDto
} from '../models/document';
import {
  UserDto, RegisterRequestDto, UpdateUserRoleRequest
} from '../models/auth-response';

// ✅ Type réel retourné par RegisterUserCommandHandler backend
export interface RegisterUserResponse {
  userId: string;
  email:  string;
  role:   'User' | 'Manager' | 'Admin';
}

@Injectable({ providedIn: 'root' })
export class AdminService {

  private readonly base = `${environment.apiUrl}/Admin`;

  constructor(private http: HttpClient) {}

  getAllUsers(): Observable<UserDto[]> {
    return this.http.get<UserDto[]>(`${this.base}/users`);
  }

  // ✅ AuthResponseDto → RegisterUserResponse (pas de token retourné par ce endpoint)
  registerUser(dto: RegisterRequestDto): Observable<RegisterUserResponse> {
    return this.http.post<RegisterUserResponse>(`${this.base}/users/register`, dto);
  }

  updateUserRole(userId: string, role: 'User' | 'Manager' | 'Admin'): Observable<void> {
    const body: UpdateUserRoleRequest = { role };
    return this.http.put<void>(`${this.base}/users/${userId}/role`, body);
  }

  getStats(): Observable<AdminStatsDto> {
    return this.http.get<AdminStatsDto>(`${this.base}/stats`);
  }

  getActivity(limit: number = 20): Observable<ActivityItemDto[]> {
    return this.http.get<ActivityItemDto[]>(`${this.base}/activity`, {
      params: { limit: limit.toString() }
    });
  }

  exportReport(): Observable<void> {
    return this.http.get(`${this.base}/export`, {
      responseType: 'blob',
      observe: 'response'
    }).pipe(
      tap((response: any) => {
        const blob = response.body!;
        const url  = URL.createObjectURL(blob);
        const a    = document.createElement('a');
        a.href     = url;
        a.download = `rapport_${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      }),
      map(() => void 0)
    );
  }
} 
