import { Component, OnInit } from '@angular/core';
import { AdminService } from '../../../core/services/admin.service';
import { UserDto } from '../../../core/models/auth-response';
import { normalizeRole } from '../../../core/utils/role.utils';

@Component({
  selector: 'app-user-list',
  templateUrl: './user-list.component.html'
})
export class UserListComponent implements OnInit {

  users: UserDto[] = [];
  error   = '';
  loadingRoleUserId: string | null = null;

  constructor(private adminService: AdminService) {}

  ngOnInit(): void {
    this.adminService.getAllUsers().subscribe({
      next: (users) => {
        this.users = users.map(u => ({ ...u, role: normalizeRole(u.role) }));
      },
      error: (err: Error) => this.error = err.message
    });
  }

  onRoleChange(userId: string, event: Event): void {
    const role = (event.target as HTMLSelectElement).value as 'User' | 'Manager' | 'Admin';
    this.changeRole(userId, role);
  }

  changeRole(userId: string, role: 'User' | 'Manager' | 'Admin'): void {
    this.loadingRoleUserId = userId;

    this.adminService.updateUserRole(userId, role).subscribe({
      next: () => {
        const user = this.users.find(u => u.id === userId);
        if (user) user.role = role;
        this.loadingRoleUserId = null;
      },
      error: (err: Error) => {
        this.error = err.message;
        this.loadingRoleUserId = null;
        this.adminService.getAllUsers().subscribe({
          next: (users) => {
            this.users = users.map(u => ({ ...u, role: normalizeRole(u.role) }));
          }
        });
      }
    });
  }
}