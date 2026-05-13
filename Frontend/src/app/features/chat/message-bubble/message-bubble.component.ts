import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { ChatMessage, SourceDto } from '../../../core/models/chat-message';

@Component({
  selector: 'app-message-bubble',
  templateUrl: './message-bubble.component.html',
  styleUrls: ['./message-bubble.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush // ✅ réactivé proprement
})
export class MessageBubbleComponent {

  private _message!: ChatMessage;

  @Input() set message(val: ChatMessage) {
    this._message = val;
    this.cdr.markForCheck(); // ✅ force re-render quand les sources arrivent
  }

  get message(): ChatMessage {
    return this._message;
  }

  @Output() feedbackSubmitted = new EventEmitter<{ message: ChatMessage; isPositive: boolean }>();

  showSources = false;

  constructor(private cdr: ChangeDetectorRef) {}

  get hasSources(): boolean {
    return !!this._message.sources?.length;
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
    this.feedbackSubmitted.emit({ message: this._message, isPositive });
  }
}