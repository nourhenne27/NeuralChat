import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

export interface RegisterModalResult {
  email: string;
  password: string;
  role: 'User' | 'Manager' | 'Admin';
}

@Component({
  selector: 'app-register-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="modal" (click)="$event.stopPropagation()">

      <div class="modal-header">
        <h3>👤 Créer un utilisateur</h3>
        <button class="btn-close" (click)="close()">✕</button>
      </div>

      <div class="modal-body">
        <label>Email</label>
        <input [(ngModel)]="form.email" placeholder="exemple@email.com" type="email" />

        <label>Mot de passe</label>
        <input [(ngModel)]="form.password" placeholder="Min. 6 caractères" type="password" />

        <label>Confirmer le mot de passe</label>
        <input [(ngModel)]="form.confirm" placeholder="Répéter le mot de passe" type="password" />

        <label>Rôle</label>
        <select [(ngModel)]="form.role">
          <option value="User">User</option>
          <option value="Manager">Manager</option>
          <option value="Admin">Admin</option>
        </select>

        <div *ngIf="errorMsg" class="error-msg">⚠ {{ errorMsg }}</div>
      </div>

      <div class="modal-footer">
        <button class="btn-cancel" (click)="close()">Annuler</button>
        <button class="btn-submit" (click)="submit()" [disabled]="loading">
          {{ loading ? 'Création...' : "Créer l'utilisateur" }}
        </button>
      </div>
    </div>
  `,
styles: [`
  :host {
    display: block;   /* ← était "flex" avec width/height 100% */
  }

  .modal {
    background: #1a1e35;
    padding: 28px;
    border-radius: 14px;
    width: 440px;
    max-width: 95vw;
    color: white;
    border: 1px solid rgba(255,255,255,0.08);
    box-shadow: 0 24px 60px rgba(0,0,0,0.6);
  }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
    }

    .modal-header h3 {
      font-size: 16px;
      font-weight: 700;
      margin: 0;
    }

    .btn-close {
      background: rgba(255,255,255,0.06);
      border: 1px solid rgba(255,255,255,0.10);
      color: #9da3bf;
      width: 30px;
      height: 30px;
      border-radius: 8px;
      cursor: pointer;
      font-size: 13px;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0;
      transition: all 0.15s;
    }

    .btn-close:hover {
      background: rgba(255,94,122,0.12);
      border-color: rgba(255,94,122,0.3);
      color: #ff5e7a;
    }

    .modal-body {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .modal-body label {
      font-size: 11px;
      color: #5a6080;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      margin-top: 8px;
    }

    .modal-body input,
    .modal-body select {
      width: 100%;
      padding: 11px 14px;
      border-radius: 8px;
      border: 1px solid rgba(255,255,255,0.10);
      background: #111320;
      color: white;
      font-size: 13px;
      outline: none;
      transition: border-color 0.15s;
      box-sizing: border-box;
    }

    .modal-body input:focus,
    .modal-body select:focus {
      border-color: rgba(0,212,255,0.4);
    }

    .error-msg {
      margin-top: 10px;
      padding: 10px 14px;
      background: rgba(255, 94, 122, 0.1);
      border: 1px solid rgba(255, 94, 122, 0.3);
      border-radius: 8px;
      color: #ff5e7a;
      font-size: 13px;
    }

    .modal-footer {
      margin-top: 24px;
      display: flex;
      gap: 10px;
      justify-content: flex-end;
    }

    .btn-cancel {
      padding: 10px 18px;
      border-radius: 8px;
      cursor: pointer;
      background: rgba(255,255,255,0.04);
      border: 1px solid rgba(255,255,255,0.10);
      color: #9da3bf;
      font-size: 13px;
      transition: all 0.15s;
    }

    .btn-cancel:hover {
      background: rgba(255,255,255,0.08);
      color: #eef0f8;
    }

    .btn-submit {
      padding: 10px 20px;
      border-radius: 8px;
      cursor: pointer;
      background: linear-gradient(135deg, #00a8cc, #00b87d);
      border: none;
      color: #000;
      font-size: 13px;
      font-weight: 600;
      transition: opacity 0.15s;
    }

    .btn-submit:hover:not(:disabled) {
      opacity: 0.85;
    }

    .btn-submit:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  `]
})
export class RegisterModalComponent {

  onSubmit!: (data: RegisterModalResult) => void;
  onClose!: () => void;
  loading = false;
  errorMsg = '';

  form = {
    email: '',
    password: '',
    confirm: '',
    role: 'User' as 'User' | 'Manager' | 'Admin'
  };

  submit() {
    this.errorMsg = '';

    if (!this.form.email) {
      this.errorMsg = 'L\'email est requis.';
      return;
    }
    if (this.form.password.length < 6) {
      this.errorMsg = 'Le mot de passe doit contenir au moins 6 caractères.';
      return;
    }
    if (this.form.password !== this.form.confirm) {
      this.errorMsg = 'Les mots de passe ne correspondent pas.';
      return;
    }

    this.loading = true;
    this.onSubmit({
      email: this.form.email.trim().toLowerCase(),
      password: this.form.password,
      role: this.form.role
    });
  }

close() {
  this.onClose?.();
}
}