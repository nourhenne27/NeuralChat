import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { SourceDto } from '../../../core/models/chat-message';
 
@Component({
  selector: 'app-source-panel',
  templateUrl: './source-panel.component.html',
  styleUrls: ['./source-panel.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SourcePanelComponent {
  @Input() sources: SourceDto[] = [];
}
 