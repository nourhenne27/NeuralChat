import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  AdminStatsDto, ActivityItemDto, ExportReportDto
} from '../models/document';
import {
  UserDto, AuthResponseDto, RegisterRequestDto, UpdateUserRoleRequest
} from '../models/auth-response';

@Injectable({ providedIn: 'root' })
export class AdminService {

  private readonly base = `${environment.apiUrl}/Admin`;

  constructor(private http: HttpClient) {}


  getAllUsers(): Observable<UserDto[]> {
    return this.http.get<UserDto[]>(`${this.base}/users`);
  }


  registerUser(dto: RegisterRequestDto): Observable<AuthResponseDto> {
    return this.http.post<AuthResponseDto>(`${this.base}/users/register`, dto);
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

  exportReport(): void {
    const token = localStorage.getItem('access_token');
    const url = `${environment.apiUrl}/admin/export`;

  
    fetch(url, {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(r => r.blob())
    .then(blob => {
      const a = document.createElement('a');
      a.href  = URL.createObjectURL(blob);
      a.download = `rapport_${new Date().toISOString().slice(0,10)}.json`;
      a.click();
      URL.revokeObjectURL(a.href);
    });
  }
}