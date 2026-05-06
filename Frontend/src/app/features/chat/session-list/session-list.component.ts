import { Component, Input, Output, EventEmitter } from '@angular/core';
import { ChatSessionDto } from '../../../core/models/chat-message';

@Component({
  selector: 'app-session-list',
  templateUrl: './session-list.component.html',
  styleUrls: ['./session-list.component.scss']
})
export class SessionListComponent {
  @Input()  sessions:        ChatSessionDto[] = [];
  @Input()  activeSessionId: string | null    = null;
  @Output() sessionSelected  = new EventEmitter<string>();
  @Output() newChat          = new EventEmitter<void>();
  @Output() sessionDeleted   = new EventEmitter<string>(); // ✅ nouveau

  confirmDeleteId: string | null = null; // ID en attente de confirmation

  onDeleteClick(event: MouseEvent, sessionId: string): void {
    event.stopPropagation(); // Évite de sélectionner la session
    this.confirmDeleteId = sessionId;
  }

  confirmDelete(): void {
    if (this.confirmDeleteId) {
      this.sessionDeleted.emit(this.confirmDeleteId);
      this.confirmDeleteId = null;
    }
  }

  cancelDelete(): void {
    this.confirmDeleteId = null;
  }
}