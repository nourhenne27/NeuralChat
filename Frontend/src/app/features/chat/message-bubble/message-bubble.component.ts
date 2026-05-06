import { Component, Input, Output, EventEmitter } from '@angular/core';
import { marked } from 'marked';
import { ChatMessage } from '../../../core/models/chat-message';

@Component({
  selector: 'app-message-bubble',
  templateUrl: './message-bubble.component.html',
  styleUrls: ['./message-bubble.component.scss']
})
export class MessageBubbleComponent {
  @Input() message!: ChatMessage;
  @Output() feedbackSubmitted = new EventEmitter<{ message: ChatMessage; isPositive: boolean }>();

  showSources = false;

  get parsedContent(): string {
    if (this.message.role === 'assistant') {
      return marked(this.message.content) as string;
    }
    return this.message.content;
  }

  get hasSources(): boolean {
    return !!this.message.sources?.length;
  }

  onFeedback(isPositive: boolean): void {
    this.feedbackSubmitted.emit({ message: this.message, isPositive });
  }
}