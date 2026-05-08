import { Component, OnInit } from '@angular/core';
import { AdminService } from '../../../core/services/admin.service';
import { ModalService } from '../../../core/services/modal.service';
import { ToastService } from '../../../core/services/toast.service';
import { AdminStatsDto, ActivityItemDto } from '../../../core/models/document';
import { UserDto } from '../../../core/models/auth-response';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-admin-dashboard',
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.scss']
})
export class AdminDashboardComponent implements OnInit {

  stats:    AdminStatsDto | null = null;
  users:    UserDto[]            = [];
  activity: ActivityItemDto[]    = [];

  isLoadingStats    = true;
  isLoadingUsers    = true;
  isLoadingActivity = true;
  error             = '';
  isAdmin           = false;

  readonly ROLES: ('User' | 'Manager' | 'Admin')[] = ['User', 'Manager', 'Admin'];

  constructor(
    private adminService: AdminService,
    private modalService: ModalService,
    private toastService: ToastService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.isAdmin = this.authService.isAdmin();
    this.loadStats();
    this.loadActivity();
    if (this.isAdmin) this.loadUsers();
    else this.isLoadingUsers = false;
  }

  private normalizeRole(role: any): string {
    if (typeof role === 'string' && ['Admin','Manager','User'].includes(role)) return role;
    const map: Record<number, string> = { 0: 'Admin', 1: 'Manager', 2: 'User' };
    return map[role as number] ?? 'User';
  }

  loadStats(): void {
    this.adminService.getStats().subscribe({
      next:  stats => { this.stats = stats; this.isLoadingStats = false; },
      error: (err: Error) => { this.error = err.message; this.isLoadingStats = false; }
    });
  }

  loadUsers(): void {
    this.adminService.getAllUsers().subscribe({
      next: users => {
        this.users = users.map(u => ({ ...u, role: this.normalizeRole(u.role) }));
        this.isLoadingUsers = false;
      },
      error: (err: Error) => { this.error = err.message; this.isLoadingUsers = false; }
    });
  }

  loadActivity(): void {
    this.adminService.getActivity(10).subscribe({
      next:  act => { this.activity = act; this.isLoadingActivity = false; },
      error: () => { this.isLoadingActivity = false; }
    });
  }

  changeRole(userId: string, role: string): void {
    this.adminService.updateUserRole(userId, role as 'User' | 'Manager' | 'Admin').subscribe({
      next: () => {
        const user = this.users.find(u => u.id === userId);
        if (user) user.role = role;
        this.toastService.success('Rôle mis à jour avec succès.');
      },
      error: (err: Error) => { this.error = err.message; }
    });
  }

  exportReport(): void {
    this.adminService.exportReport();
  }

  openAddUserModal(): void {
    if (!this.isAdmin) return;
    const result$ = this.modalService.openRegisterModal();
    result$.subscribe({
      next: (data) => {
        if (!data) return;
        this.modalService.setLoading(true);
        this.adminService.registerUser(data).subscribe({
          next: (res) => {
            this.modalService.closeModal();
            const newUser: UserDto = {
              id: res.userId || '',
              email: res.email,
              role: this.normalizeRole(res.role),
              createdAt: new Date().toISOString()
            };
            this.users = [newUser, ...this.users];
            if (this.stats) this.stats.totalUsers++;
            this.toastService.success(`Utilisateur ${res.email} créé !`);
          },
          error: (err) => {
            this.modalService.setLoading(false);
            this.toastService.error(err?.error?.message || 'Erreur lors de la création');
          }
        });
      },
      error: (err) => { console.error(err); this.modalService.closeModal(); },
      complete: () => {}
    });
  }
}