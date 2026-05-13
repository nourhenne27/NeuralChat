import { Component, OnInit }           from '@angular/core';
import { HttpEventType }               from '@angular/common/http';
import { DocumentService, UserRole }   from '../../../core/services/document.service';
import { AuthService }                 from '../../../core/services/auth.service';
import { DocumentDto }                 from '../../../core/models/document';

interface DocRow {
  id:           string;
  name:         string;
  ext:          string;
  date:         string;
  status:       string;
  roleRequired: UserRole; // ✅ ajout
}

@Component({
  selector:    'app-document-list',
  templateUrl: './document-list.component.html',
  styleUrls:   ['./document-list.component.scss']
})
export class DocumentListComponent implements OnInit {

  documents:      DocRow[] = [];
  isLoading =     true;
  error     =     '';
  canDelete =     false;
  canUpload =     false;

  isDragOver =     false;
  isUploading =    false;
  uploadProgress = 0;
  uploadName =     '';
  uploadError =    '';

  confirmDeleteId:  string | null = null;
  updatingRoleId:   string | null = null; // ✅ spinner rôle

  selectedRole: UserRole = 'User';

  constructor(
    private documentService: DocumentService,
    private authService:     AuthService
  ) {}

  ngOnInit(): void {
    this.canDelete = this.authService.isAdminOrManager();
    this.canUpload = this.authService.isAdminOrManager();
    this.loadDocuments();
  }

  loadDocuments(): void {
    this.isLoading = true;
    this.error     = '';

    this.documentService.getDocuments().subscribe({
      next: (docs: DocumentDto[]) => {
        this.documents = docs.map(d => this.toRow(d));
        this.isLoading = false;
      },
      error: (err: Error) => {
        this.error     = err.message;
        this.isLoading = false;
      }
    });
  }

  private toRow(d: DocumentDto): DocRow {
    return {
      id:           d.id,
      name:         d.name,
      ext:          d.format?.toUpperCase() ?? d.name.split('.').pop()?.toUpperCase() ?? '?',
      date:         d.uploadedAt
        ? new Date(d.uploadedAt).toLocaleDateString('fr-FR', {
            day: '2-digit', month: '2-digit', year: 'numeric'
          })
        : '—',
      status:       d.status ?? 'Pending',
      roleRequired: (d.roleRequired as UserRole) ?? 'User' // ✅
    };
  }

  // ✅ Changer le rôle d'un document existant
  onRoleChange(doc: DocRow, event: Event): void {
    const role = (event.target as HTMLSelectElement).value as UserRole;
    this.updatingRoleId = doc.id;

    this.documentService.updateDocumentRole(doc.id, role).subscribe({
      next: () => {
        doc.roleRequired    = role;
        this.updatingRoleId = null;
      },
      error: (err: Error) => {
        this.error          = err.message;
        this.updatingRoleId = null;
      }
    });
  }

  onDeleteClick(id: string): void { this.confirmDeleteId = id; }
  cancelDelete():  void { this.confirmDeleteId = null; }

  confirmDelete(): void {
    if (!this.confirmDeleteId) return;
    const id = this.confirmDeleteId;
    this.confirmDeleteId = null;

    this.documentService.deleteDocument(id).subscribe({
      next:  () => { this.documents = this.documents.filter(d => d.id !== id); },
      error: (err: Error) => { this.error = err.message; }
    });
  }

  onDragOver(e: DragEvent): void { e.preventDefault(); this.isDragOver = true; }
  onDragLeave(): void { this.isDragOver = false; }

  onDrop(e: DragEvent): void {
    e.preventDefault();
    this.isDragOver = false;
    if (!this.canUpload) {
      this.uploadError = 'Vous n\'avez pas les droits pour uploader des documents.';
      return;
    }
    const file = e.dataTransfer?.files?.[0];
    if (file) this.uploadFile(file);
  }

  triggerFileInput(): void {
    if (this.isUploading) return;
    document.getElementById('file-input')?.click();
  }

  onFileSelected(e: Event): void {
    const input = e.target as HTMLInputElement;
    const file  = input.files?.[0];
    if (file) this.uploadFile(file);
    (e.target as HTMLInputElement).value = '';
  }

  private uploadFile(file: File): void {
    const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
    if (!['pdf', 'docx', 'txt', 'md'].includes(ext)) {
      this.uploadError = `Format .${ext} non supporté. Formats acceptés : pdf, docx, txt, md`;
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      this.uploadError = 'Fichier trop volumineux (max 50 Mo)';
      return;
    }

    this.isUploading    = true;
    this.uploadProgress = 0;
    this.uploadName     = file.name;
    this.uploadError    = '';

    this.documentService.uploadDocument(file, this.selectedRole).subscribe({
      next: event => {
        if (event.type === HttpEventType.UploadProgress && event.total) {
          this.uploadProgress = Math.round(100 * event.loaded / event.total);
        }
        if (event.type === HttpEventType.Response) {
          this.isUploading    = false;
          this.uploadProgress = 0;
          this.loadDocuments();
        }
      },
      error: (err: Error) => {
        this.isUploading    = false;
        this.uploadProgress = 0;
        this.uploadError    = err.message;
      }
    });
  }

  getRoleLabel(role: UserRole): string {
    return ({
      User:    'Tous',
      Manager: 'Manager+',
      Admin:   'Admin'
    } as Record<string, string>)[role] ?? role;
  }

  getRoleClass(role: UserRole): string {
    return ({
      User:    'role-user',
      Manager: 'role-manager',
      Admin:   'role-admin'
    } as Record<string, string>)[role] ?? '';
  }

  getStatusClass(status: string): string {
    return ({
      Indexed:  'status-indexed',
      Pending:  'status-pending',
      Failed:   'status-error',
      Deleting: 'status-pending'
    } as Record<string, string>)[status] ?? '';
  }

  getStatusLabel(status: string): string {
    return ({
      Indexed:  '● Indexé',
      Pending:  '◌ En attente',
      Failed:   '✕ Erreur',
      Deleting: '⟳ Suppression...'
    } as Record<string, string>)[status] ?? status;
  }
}
