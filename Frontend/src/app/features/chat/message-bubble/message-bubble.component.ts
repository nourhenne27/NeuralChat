import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { ChatMessage, SourceDto } from '../../../core/models/chat-message';

@Component({
  selector: 'app-message-bubble',
  templateUrl: './message-bubble.component.html',
  styleUrls: ['./message-bubble.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MessageBubbleComponent {
  @Input() message!: ChatMessage;
  @Output() feedbackSubmitted = new EventEmitter<{ message: ChatMessage; isPositive: boolean }>();

  showSources = false;

  get hasSources(): boolean {
    return !!this.message.sources?.length;
  }

  getTitle(src: any): string {
    return src?.documentTitle || src?.document_title || src?.title || src?.name || '';
  }

  uniqueSources(sources: SourceDto[] | undefined): any[] {
    if (!sources?.length) return [];
    const seen = new Set<string>();
    return sources.filter(src => {
      const title = this.getTitle(src);
      if (!title || seen.has(title)) return false;
      seen.add(title);
      return true;
    });
  }

  onFeedback(isPositive: boolean): void {
    this.feedbackSubmitted.emit({ message: this.message, isPositive });
  }
}