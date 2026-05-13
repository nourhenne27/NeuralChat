import { Component, Output, EventEmitter, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-chat-input',
  standalone: true,
  imports: [FormsModule, CommonModule],
  template: `
    <div class="chat-input-wrap">
      <textarea
        class="chat-textarea"
        [(ngModel)]="inputText"
        (keydown)="onKeyDown($event)"
        placeholder="Posez votre question… (Entrée pour envoyer)"
        rows="1">
      </textarea>
      <button class="send-btn"
              (click)="send()"
              [disabled]="!inputText.trim() || disabled">
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
          <path d="M14 8L2 2l2.5 6L2 14l12-6z" fill="white" stroke="white" stroke-width="0.5" stroke-linejoin="round"/>
        </svg>
      </button>
    </div>
  `,
  styles: [`
    .chat-input-wrap { display: flex; align-items: flex-end; gap: 8px; }
    .chat-textarea {
      flex: 1; background: #2a2a3e; border: 1px solid #444;
      border-radius: 8px; color: #fff; padding: 10px;
      font-size: 14px; resize: none; box-sizing: border-box;
    }
    .send-btn {
      background: #6c63ff; border: none; border-radius: 8px;
      padding: 10px 14px; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
    }
    .send-btn:disabled { opacity: 0.4; cursor: not-allowed; }
  `]
})
export class ChatInputComponent {
  @Input() disabled = false;
  @Output() messageSent = new EventEmitter<string>();

  inputText = '';

  send(): void {
    const text = this.inputText.trim();
    if (!text || this.disabled) return;
    this.messageSent.emit(text);
    this.inputText = '';
  }

  onKeyDown(e: KeyboardEvent): void {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      this.send();
    }
  }
}