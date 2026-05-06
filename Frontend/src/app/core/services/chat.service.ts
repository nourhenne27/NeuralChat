import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  ChatRequestDto,
  ChatMessageDto,
  ChatSessionDto,
  CreateSessionResponse
} from '../models/chat-message';

@Injectable({ providedIn: 'root' })
export class ChatService {

  private base = `${environment.apiUrl}/Chat`;

  constructor(private http: HttpClient) {}

  createSession(): Observable<CreateSessionResponse> {
    return this.http.post<CreateSessionResponse>(`${this.base}/session`, {});
  }

  getUserSessions(): Observable<ChatSessionDto[]> {
    return this.http.get<ChatSessionDto[]>(`${this.base}/sessions`);
  }

  deleteSession(sessionId: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/session/${sessionId}`);
  }

  getHistory(sessionId: string): Observable<ChatMessageDto[]> {
    return this.http.get<ChatMessageDto[]>(`${this.base}/history/${sessionId}`);
  }

  sendMessageStream(dto: ChatRequestDto): Observable<string> {
    return new Observable<string>(observer => {
      const token = this.getAuthToken();
      const ctrl  = new AbortController();

      fetch(`${this.base}/send`, {
        method: 'POST',
        signal: ctrl.signal,
        headers: {
          'Content-Type': 'application/json',
          'Accept':       'text/event-stream',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(dto)
      })
      .then(async response => {
        if (!response.ok) {
          observer.error(new Error(`HTTP ${response.status}`));
          return;
        }

        const reader  = response.body!.getReader();
        const decoder = new TextDecoder('utf-8');
        let buffer    = '';

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          const parts = buffer.split('\n\n');
          buffer = parts.pop() ?? '';

          for (const part of parts) {
            const line = part.trim();
            if (!line.startsWith('data:')) continue;

            const raw     = line.slice(5);
            const payload = raw.startsWith(' ') ? raw.slice(1) : raw;

            if (payload === '[DONE]') { observer.complete(); return; }
            if (payload.startsWith('[ERROR]')) {
              observer.error(new Error(payload.slice(7).trim()));
              return;
            }

            observer.next(payload);
          }
        }

        observer.complete();
      })
      .catch(err => {
        if (err.name !== 'AbortError') observer.error(err);
      });

      return () => ctrl.abort();
    });
  }

  private getAuthToken(): string | null {
    return (
      localStorage.getItem('access_token') ??
      localStorage.getItem('token')        ??
      localStorage.getItem('auth_token')   ??
      null
    );
  }
}