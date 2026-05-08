import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { ChatSessionDto } from '../models/chat-message';

const SESSION_ID_KEY = 'last_session_id';

@Injectable({ providedIn: 'root' })
export class ChatStateService {

  private _sessions$  = new BehaviorSubject<ChatSessionDto[]>([]);
  private _sessionId$ = new BehaviorSubject<string | null>(this.restoreSessionId());
  private _newChat$   = new BehaviorSubject<number>(0);

  readonly sessions$:  Observable<ChatSessionDto[]> = this._sessions$.asObservable();
  readonly sessionId$: Observable<string | null>    = this._sessionId$.asObservable();
  readonly newChat$:   Observable<number>           = this._newChat$.asObservable();

  setSessions(sessions: ChatSessionDto[]): void {
    this._sessions$.next(sessions);
  }

  setSessionId(id: string | null): void {
    this._sessionId$.next(id);
    this.persistSessionId(id);
  }

  selectSession(id: string): void {
    this._sessionId$.next(id);
    this.persistSessionId(id);
  }

  triggerNewChat(): void {
    this._sessionId$.next(null);
    this.persistSessionId(null);
    this._newChat$.next(this._newChat$.getValue() + 1);
  }

  getSessionId(): string | null {
    return this._sessionId$.getValue();
  }

  getSessions(): ChatSessionDto[] {
    return this._sessions$.getValue();
  }

  // ── sessionStorage persistence ────────────────────────────

  private persistSessionId(id: string | null): void {
    try {
      if (id) sessionStorage.setItem(SESSION_ID_KEY, id);
      else    sessionStorage.removeItem(SESSION_ID_KEY);
    } catch {}
  }

  private restoreSessionId(): string | null {
    try {
      return sessionStorage.getItem(SESSION_ID_KEY);
    } catch {
      return null;
    }
  }
} 