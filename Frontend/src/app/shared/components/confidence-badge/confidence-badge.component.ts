
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-confidence-badge',
  template: `
    <span class="confidence-pill" [ngClass]="getClass()">
      {{ (score * 100).toFixed(0) }}% confiance
    </span>
  `,
  styleUrls: ['./confidence-badge.component.scss']
})
export class ConfidenceBadgeComponent {
  @Input() score: number = 0;

  getClass(): string {
    if (this.score >= 0.9) return 'conf-high';
    if (this.score >= 0.7) return 'conf-med';
    return 'conf-low';
  }
}