import { Component, Output, EventEmitter, Input } from '@angular/core';

@Component({
  selector: 'app-chat-input',
  templateUrl: './chat-input.component.html',
  styleUrls: ['./chat-input.component.scss']
})
export class ChatInputComponent {
  @Input() disabled = false;
  @Output() messageSent = new EventEmitter<string>();

  text = '';

  send(textarea?: HTMLTextAreaElement): void {
    const trimmed = this.text.trim();
    if (!trimmed || this.disabled) return;
    this.messageSent.emit(trimmed);
    this.text = '';
    if (textarea) {
      textarea.style.height = 'auto';
    }
  }

  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.send(event.target as HTMLTextAreaElement);
    }
  }

  autoResize(textarea: HTMLTextAreaElement): void {
    textarea.style.height = 'auto';
    textarea.style.height = `${textarea.scrollHeight}px`;
  }
}