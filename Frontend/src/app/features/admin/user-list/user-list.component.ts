import { Component, OnInit } from '@angular/core';
import { AdminService } from '../../../core/services/admin.service';
import { UserDto } from '../../../core/models/auth-response';

@Component({
  selector: 'app-user-list',
  templateUrl: './user-list.component.html'
})
export class UserListComponent implements OnInit {

  users: UserDto[] = [];
  error = '';

  constructor(private adminService: AdminService) {}

  ngOnInit(): void {
    this.adminService.getAllUsers().subscribe({
      next: (users) => {
        this.users = users.map(u => ({
          ...u,
          role: this.normalizeRole(u.role)
        }));
      },
      error: (err: Error) => this.error = err.message
    });
  }

  private normalizeRole(role: any): string {
    if (typeof role === 'string') return role;
    const map: Record<number, string> = { 0: 'Admin', 1: 'Manager', 2: 'User' };
    return map[role] ?? 'User';
  }

  changeRole(userId: string, role: string): void {
    this.adminService.updateUserRole(userId, role as 'User' | 'Manager' | 'Admin').subscribe({
      next: () => {},
      error: (err: Error) => {
        this.error = err.message;
        this.adminService.getAllUsers().subscribe({
          next: (users) => {
            this.users = users.map(u => ({ ...u, role: this.normalizeRole(u.role) }));
          }
        });
      }
    });
  }
}