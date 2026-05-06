import { Component, Input, Output, EventEmitter } from '@angular/core';

export interface FeedbackResult {
  score: number;
  comment: string;
}

@Component({
  selector: 'app-feedback-modal',
  template: `
    <div class="modal-overlay" (click)="onOverlayClick($event)">
      <div class="modal-box" #box>
        <div class="modal-header">
          <span>{{ isPositive ? '👍 Bon résultat' : '👎 Mauvais résultat' }}</span>
          <button class="close-btn" (click)="cancel()">✕</button>
        </div>

        <div class="modal-body">
          <p class="label">Note :</p>
          <div class="stars">
            <span
              *ngFor="let s of stars"
              class="star"
              [class.active]="s <= hovered || s <= score"
              [class.hovered]="s <= hovered"
              (mouseenter)="hovered = s"
              (mouseleave)="hovered = 0"
              (click)="score = s">
              ★
            </span>
          </div>

          <p class="label">Commentaire (optionnel) :</p>
          <textarea
            class="comment-input"
            [(ngModel)]="comment"
            placeholder="Expliquez votre évaluation..."
            rows="3">
          </textarea>
        </div>

        <div class="modal-footer">
          <button class="btn-cancel" (click)="cancel()">Annuler</button>
          <button class="btn-submit" [disabled]="score === 0" (click)="submit()">
            Envoyer
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .modal-overlay {
      position: fixed; inset: 0;
      background: rgba(0,0,0,0.6);
      display: flex; align-items: center; justify-content: center;
      z-index: 1000;
    }
    .modal-box {
      background: #1e1e2e;
      border: 1px solid #333;
      border-radius: 12px;
      padding: 24px;
      width: 360px;
      color: #fff;
    }
    .modal-header {
      display: flex; justify-content: space-between; align-items: center;
      font-size: 16px; font-weight: 600; margin-bottom: 20px;
    }
    .close-btn {
      background: none; border: none; color: #aaa;
      cursor: pointer; font-size: 16px;
    }
    .label { color: #aaa; font-size: 13px; margin-bottom: 8px; }
    .stars {
      display: flex; gap: 8px; margin-bottom: 16px;
    }
    .star {
      font-size: 28px; cursor: pointer; color: #444;
      transition: color 0.15s;
    }
    .star.active, .star.hovered { color: #f5a623; }
    .comment-input {
      width: 100%; background: #2a2a3e;
      border: 1px solid #444; border-radius: 8px;
      color: #fff; padding: 10px; font-size: 13px;
      resize: none; box-sizing: border-box;
    }
    .modal-footer {
      display: flex; justify-content: flex-end;
      gap: 10px; margin-top: 16px;
    }
    .btn-cancel {
      background: #333; border: none; border-radius: 8px;
      color: #aaa; padding: 8px 16px; cursor: pointer;
    }
    .btn-submit {
      background: #6c63ff; border: none; border-radius: 8px;
      color: #fff; padding: 8px 16px; cursor: pointer;
      font-weight: 600;
    }
    .btn-submit:disabled { opacity: 0.4; cursor: not-allowed; }
  `]
})
export class FeedbackModalComponent {
  @Input() isPositive = true;
  @Output() confirmed = new EventEmitter<FeedbackResult>();
  @Output() cancelled = new EventEmitter<void>();

  score = 0;
  hovered = 0;
  comment = '';
  stars = [1, 2, 3, 4, 5];

  submit(): void {
    if (this.score === 0) return;
    this.confirmed.emit({ score: this.score, comment: this.comment });
  }

  cancel(): void {
    this.cancelled.emit();
  }

  onOverlayClick(e: MouseEvent): void {
    if ((e.target as HTMLElement).classList.contains('modal-overlay')) {
      this.cancel();
    }
  }
}