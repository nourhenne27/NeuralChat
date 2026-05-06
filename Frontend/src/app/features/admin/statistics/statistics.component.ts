import { Component, OnInit } from '@angular/core';
import { AdminService } from '../../../core/services/admin.service';
import { AdminStatsDto, ActivityItemDto } from '../../../core/models/document';
import { UserDto } from '../../../core/models/auth-response';
import { ModalService } from '../../../core/services/modal.service';

@Component({
  selector: 'app-statistics',
  templateUrl: './statistics.component.html',
  styleUrls: ['./statistics.component.scss']
})
export class StatisticsComponent implements OnInit {

  users:      UserDto[]         = [];
  activities: ActivityItemDto[] = [];

  isLoadingUsers    = true;
  isLoadingActivity = true;

  error   = '';
  success = '';

  stats = [
    { icon: '💬', label: 'Questions traitées',  value: '—', colorClass: 'icon-cyan'    },
    { icon: '📄', label: 'Documents indexés',   value: '—', colorClass: 'icon-emerald' },
    { icon: '👥', label: 'Utilisateurs actifs', value: '—', colorClass: 'icon-violet'  },
    { icon: '⚡', label: 'Confiance moyenne',   value: '—', colorClass: 'icon-amber'   },
  ];

  constructor(
    private adminService: AdminService,
    private modalService: ModalService
  ) {}

  ngOnInit(): void {
    this.loadStats();
    this.loadUsers();
    this.loadActivity();
  }

  private loadStats(): void {
    this.adminService.getStats().subscribe({
      next: (s: AdminStatsDto) => {
        this.stats[0].value = s.totalQuestions.toLocaleString('fr-FR');
        this.stats[1].value = s.totalDocuments.toString();
        this.stats[2].value = s.totalUsers.toString();
        this.stats[3].value = (s.averageConfidenceScore * 100).toFixed(0) + '%';
      },
      error: (err: Error) => this.showError(err.message)
    });
  }

  loadUsers(): void {
    this.isLoadingUsers = true;
    this.adminService.getAllUsers().subscribe({
      next:  users => { this.users = users; this.isLoadingUsers = false; },
      error: (err: Error) => { this.showError(err.message); this.isLoadingUsers = false; }
    });
  }

  private loadActivity(): void {
    this.isLoadingActivity = true;
    this.adminService.getActivity(10).subscribe({
      next:  acts => { this.activities = acts; this.isLoadingActivity = false; },
      error: () => { this.isLoadingActivity = false; }
    });
  }

  // ── Opens modal rendered directly at <body> level ─────────────
  openRegisterModal(): void {
    const result$ = this.modalService.openRegisterModal();

    result$.subscribe(result => {
      if (!result) return; // cancelled

      this.adminService.registerUser(result).subscribe({
        next: () => {
          this.showSuccess(`✅ Utilisateur « ${result.email} » créé avec succès.`);
          this.loadUsers();
          this.loadStats();
        },
        error: (err: any) => {
          const msg = err?.error?.errors
            ? Object.values(err.error.errors).flat().join(' ')
            : err?.error?.message ?? err?.message ?? 'Erreur lors de la création.';
          this.showError(msg);
        }
      });
    });
  }

  changeRole(userId: string, event: Event): void {
    const role = (event.target as HTMLSelectElement).value as 'User' | 'Manager' | 'Admin';
    this.adminService.updateUserRole(userId, role).subscribe({
      next: () => {
        const user = this.users.find(u => u.id === userId);
        if (user) user.role = role;
        this.showSuccess('Rôle mis à jour.');
      },
      error: (err: Error) => this.showError(err.message)
    });
  }

  exportReport(): void {
    this.adminService.exportReport();
    this.showSuccess('Export en cours de téléchargement…');
  }

  getRoleClass(role: string): string {
    return { Admin: 'role-admin', Manager: 'role-manager', User: 'role-user' }[role] ?? '';
  }

  getRoleAvatarClass(role: string): string {
    return { Admin: 'avatar-admin', Manager: 'avatar-manager', User: 'avatar-user' }[role] ?? '';
  }

  formatActivity(act: ActivityItemDto): string {
    return `<strong>${act.actor}</strong> ${act.action}`;
  }

  formatTime(isoDate: string): string {
    const d = new Date(isoDate);
    const diff = Math.floor((Date.now() - d.getTime()) / 60000);
    if (diff < 1)    return 'À l\'instant';
    if (diff < 60)   return `Il y a ${diff} min`;
    if (diff < 1440) return `Il y a ${Math.floor(diff / 60)}h`;
    return `Il y a ${Math.floor(diff / 1440)}j`;
  }

  private showError(msg: string): void {
    this.error = msg; this.success = '';
    setTimeout(() => this.error = '', 5000);
  }

  private showSuccess(msg: string): void {
    this.success = msg; this.error = '';
    setTimeout(() => this.success = '', 4000);
  }
}