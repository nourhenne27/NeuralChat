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

  send(): void {
    const trimmed = this.text.trim();
    if (!trimmed || this.disabled) return;
    this.messageSent.emit(trimmed);
    this.text = '';
  }

  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.send();
    }
  }
}