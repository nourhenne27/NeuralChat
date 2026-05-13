import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { AdminService } from './admin.service';
import { UserDto } from '../models/auth-response';

@Injectable({ providedIn: 'root' })
export class UserStateService {
  private usersSubject = new BehaviorSubject<UserDto[]>([]);
  users$ = this.usersSubject.asObservable();

  constructor(private adminService: AdminService) {}

  loadUsers(): void {
    this.adminService.getAllUsers().subscribe({
      next:  (users: UserDto[]) => this.usersSubject.next(users),
      error: ()                  => this.usersSubject.next([])
    });
  }

  updateRole(userId: string, role: 'User' | 'Manager' | 'Admin'): Observable<void> {
    return this.adminService.updateUserRole(userId, role);
  }
}