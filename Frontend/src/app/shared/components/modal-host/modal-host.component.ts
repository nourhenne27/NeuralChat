import {
  Component,
  OnInit,
  OnDestroy,
  ViewEncapsulation
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { ModalService } from '../../../core/services/modal.service';

@Component({
  selector: 'app-modal-host',
  standalone: true,
  encapsulation: ViewEncapsulation.None,
  imports: [CommonModule, FormsModule],

  template: `
    <ng-container *ngIf="isOpen">

      <div class="register-backdrop" (click)="close()"></div>

      <div class="register-wrap">
        <div class="register-modal" (click)="$event.stopPropagation()">

          <div class="register-header">
            <h3>👤 Créer un utilisateur</h3>
            <button class="register-close" (click)="close()">✕</button>
          </div>

          <div class="register-body">

            <label>Email</label>
            <input
              [(ngModel)]="form.email"
              placeholder="exemple@email.com"
              type="email"
            />

            <label>Mot de passe</label>
            <input
              [(ngModel)]="form.password"
              placeholder="Min. 6 caractères"
              type="password"
            />

            <label>Confirmer le mot de passe</label>
            <input
              [(ngModel)]="form.confirm"
              placeholder="Répéter le mot de passe"
              type="password"
            />

            <label>Rôle</label>

            <select [(ngModel)]="form.role">
              <option value="User">User</option>
              <option value="Manager">Manager</option>
              <option value="Admin">Admin</option>
            </select>

            <div *ngIf="errorMsg" class="register-error">
              ⚠ {{ errorMsg }}
            </div>

          </div>

          <div class="register-footer">

            <button
              class="register-btn-cancel"
              (click)="close()"
            >
              Annuler
            </button>

            <button
              class="register-btn-submit"
              (click)="submit()"
              [disabled]="isLoading"
            >
              {{ isLoading ? 'Création...' : "Créer l'utilisateur" }}
            </button>

          </div>

        </div>
      </div>

    </ng-container>
  `,

  styles: []
})
export class ModalHostComponent implements OnInit, OnDestroy {

  isOpen = false;
  isLoading = false;
  errorMsg = '';

  form = {
    email: '',
    password: '',
    confirm: '',
    role: 'User' as 'User' | 'Manager' | 'Admin'
  };

  private destroy$ = new Subject<void>();

  constructor(
    private modalService: ModalService
  ) { }

  ngOnInit(): void {

    this.modalService.isOpen$
      .pipe(takeUntil(this.destroy$))
      .subscribe(open => {

        this.isOpen = open;

        if (open) {

          this.form = {
            email: '',
            password: '',
            confirm: '',
            role: 'User'
          };

          this.errorMsg = '';
        }
      });

    this.modalService.loading$
      .pipe(takeUntil(this.destroy$))
      .subscribe(loading => {

        this.isLoading = loading;

      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  close(): void {
    this.modalService.closeModal();
  }
  submit(): void {

    this.errorMsg = '';

    if (!this.form.email) {
      this.errorMsg = "L'email est requis.";
      return;
    }

    const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!EMAIL_REGEX.test(this.form.email.trim())) {
      this.errorMsg = "Format d'email invalide.";
      return;
    }

    if (this.form.password.length < 6) {
      this.errorMsg = 'Min. 6 caractères.';
      return;
    }

    if (this.form.password !== this.form.confirm) {
      this.errorMsg = 'Mots de passe différents.';
      return;
    }

    this.modalService.submit({
      email: this.form.email.trim().toLowerCase(),
      password: this.form.password,
      role: this.form.role
    });
  }
}
