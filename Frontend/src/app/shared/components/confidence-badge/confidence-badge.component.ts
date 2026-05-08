import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
 
@Component({
  selector: 'app-confidence-badge',
  templateUrl: './confidence-badge.component.html',
  styleUrls: ['./confidence-badge.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ConfidenceBadgeComponent {
  @Input() score: number = 0;
 
  getClass(): string {
    if (this.score >= 0.9) return 'conf-high';
    if (this.score >= 0.7) return 'conf-med';
    return 'conf-low';
  }
}
 