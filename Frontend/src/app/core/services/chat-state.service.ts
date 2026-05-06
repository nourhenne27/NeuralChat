import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { ChatSessionDto } from '../models/chat-message';

@Injectable({ providedIn: 'root' })
export class ChatStateService {

  sessions$  = new BehaviorSubject<ChatSessionDto[]>([]);
  sessionId$ = new BehaviorSubject<string | null>(null);
  newChat$   = new BehaviorSubject<number>(0);

  setSessions(sessions: ChatSessionDto[]): void {
    this.sessions$.next(sessions);
  }

  setSessionId(id: string | null): void {
    this.sessionId$.next(id);
  }

  selectSession(id: string): void {
    this.sessionId$.next(id);
  }

  triggerNewChat(): void {
    this.sessionId$.next(null);
    this.newChat$.next(this.newChat$.getValue() + 1);
  }

  getSessionId(): string | null {
    return this.sessionId$.getValue();
  }
}