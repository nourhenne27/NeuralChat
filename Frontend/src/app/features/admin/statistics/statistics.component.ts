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
 
  // ── Normalise le rôle : gère les valeurs entières (0/1/2) renvoyées par certains backends
  private normalizeRole(role: any): string {
    if (typeof role === 'string' && ['Admin', 'Manager', 'User'].includes(role)) return role;
    const map: Record<number, string> = { 0: 'Admin', 1: 'Manager', 2: 'User' };
    return map[role as number] ?? 'User';
  }
 
  private loadStats(): void {
    this.adminService.getStats().subscribe({
      next: (s: AdminStatsDto) => {
        // Guard sur chaque champ pour éviter NaN / erreur si le backend renvoie null
        const questions  = s.totalQuestions  ?? 0;
        const documents  = s.totalDocuments  ?? 0;
        const users      = s.totalUsers      ?? 0;
        const confidence = s.averageConfidenceScore ?? 0;
 
        this.stats[0].value = questions.toLocaleString('fr-FR');
        this.stats[1].value = documents.toLocaleString('fr-FR');
        this.stats[2].value = users.toLocaleString('fr-FR');
        // Le backend renvoie déjà 0–100
        this.stats[3].value = confidence.toFixed(0) + '%';
      },
      error: (err: any) => this.showError(err?.error?.message ?? err?.message ?? 'Erreur stats')
    });
  }
 
  loadUsers(): void {
    this.isLoadingUsers = true;
    this.adminService.getAllUsers().subscribe({
      next: users => {
        // Normalise les rôles au cas où le backend renvoie des entiers
        this.users = users.map(u => ({ ...u, role: this.normalizeRole(u.role) }));
        this.isLoadingUsers = false;
      },
      error: (err: any) => {
        this.showError(err?.error?.message ?? err?.message ?? 'Erreur utilisateurs');
        this.isLoadingUsers = false;
      }
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
      error: (err: any) => this.showError(err?.error?.message ?? err?.message ?? 'Erreur rôle')
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
    if (isNaN(d.getTime())) return '—';
    const diff = Math.floor((Date.now() - d.getTime()) / 60000);
    if (diff < 1)    return 'À l\'instant';
    if (diff < 60)   return `Il y a ${diff} min`;
    if (diff < 1440) return `Il y a ${Math.floor(diff / 60)}h`;
    return `Il y a ${Math.floor(diff / 1440)}j`;
  }
 
  // Formate la date d'inscription en format lisible fr-FR
  formatDate(isoDate: string): string {
    if (!isoDate) return '—';
    const d = new Date(isoDate);
    if (isNaN(d.getTime())) return isoDate;
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
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