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
      next: (users) => this.users = users,
      error: (err: Error) => this.error = err.message
    });
  }

  // ✅ Utilise AdminService (PUT) au lieu de HttpClient direct (PATCH)
changeRole(userId: string, event: Event): void {
  const role = (event.target as HTMLSelectElement).value;
  this.adminService.updateUserRole(userId, role as 'User' | 'Manager' | 'Admin').subscribe({
      next: () => {
        const user = this.users.find(u => u.id === userId);
        if (user) user.role = role;
      },
      error: (err: Error) => this.error = err.message
    });
  }
}