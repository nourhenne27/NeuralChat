import { Component, OnInit } from '@angular/core';
import { AdminService } from '../../../core/services/admin.service';
import { ModalService } from '../../../core/services/modal.service';
import { ToastService } from '../../../core/services/toast.service';
import {
  AdminStatsDto, ActivityItemDto
} from '../../../core/models/document';
import { UserDto } from '../../../core/models/auth-response';

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

  readonly ROLES: ('User' | 'Manager' | 'Admin')[] = ['User', 'Manager', 'Admin'];

  constructor(
    private adminService: AdminService,
    private modalService: ModalService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.loadStats();
    this.loadUsers();
    this.loadActivity();
  }

  loadStats(): void {
    this.adminService.getStats().subscribe({
      next:  stats => { this.stats = stats; this.isLoadingStats = false; },
      error: (err: Error) => { this.error = err.message; this.isLoadingStats = false; }
    });
  }

  loadUsers(): void {
    this.adminService.getAllUsers().subscribe({
      next:  users => { this.users = users; this.isLoadingUsers = false; },
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

  // ── Ouvrir la modal d'ajout d'utilisateur ────────────────────
  openAddUserModal(): void {
    console.log('🚀 Modal ouverte');

    const result$ = this.modalService.openRegisterModal();

    result$.subscribe({
      next: (data) => {
        console.log('📥 Données reçues du modal:', data);
        if (!data) return;

        this.modalService.setLoading(true);

        this.adminService.registerUser(data).subscribe({
          next: (res) => {
            console.log('✅ Utilisateur créé:', res);
            this.modalService.closeModal();

            // Correction : Utiliser la bonne structure de AuthResponseDto
            const newUser: UserDto = {
              id:        res.userId || '',           // ← important
              email:     res.email,
              role:      res.role,
              createdAt: new Date().toISOString()
            };

            this.users = [newUser, ...this.users];
            if (this.stats) this.stats.totalUsers++;

            this.toastService.success(`Utilisateur ${res.email} créé avec succès !`);
          },
          error: (err) => {
            console.error('❌ Erreur création:', err);
            this.modalService.setLoading(false);
            const msg = err?.error?.message || err?.message || 'Erreur lors de la création';
            this.toastService.error(msg);
          }
        });
      },
      error: (err) => {
        console.error(err);
        this.modalService.closeModal();
      }
    });
  }
}