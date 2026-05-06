import {
  Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewChecked
} from '@angular/core';
import { Subscription } from 'rxjs';
import { distinctUntilChanged } from 'rxjs/operators';
import { ChatService }      from '../../../core/services/chat.service';
import { ChatStateService } from '../../../core/services/chat-state.service';
import { ChatMessage, ChatSessionDto } from '../../../core/models/chat-message';
import { DocumentService } from '../../../core/services/document.service';
import { FeedbackService } from '../../../core/services/feedback.service';
import { FeedbackResult }  from '../feedback-modal/feedback-modal.component';

@Component({
  selector:    'app-chat-window',
  templateUrl: './chat-window.component.html',
  styleUrls:   ['./chat-window.component.scss']
})
export class ChatWindowComponent implements OnInit, OnDestroy, AfterViewChecked {

  @ViewChild('scrollContainer') scrollContainer!: ElementRef;

  messages:  ChatMessage[] = [];
  sessionId: string | null = null;

  isLoading =      false;
  error =          '';
  inputText =      '';
  documentsCount = 0;
  suggestions:     string[] = [];

  showFeedbackModal  = false;
  feedbackIsPositive = true;
  pendingFeedbackMsg: ChatMessage | null = null;

  private streamSub?:   Subscription;
  private subs =        new Subscription();
  private shouldScroll = false;

  constructor(
    private chatService:     ChatService,
    private chatState:       ChatStateService,
    private documentService: DocumentService,
    private feedbackService: FeedbackService
  ) {}

  ngOnInit(): void {
    this.loadSuggestions();
    this.loadDocumentsCount();
    this.loadSessions(true);

    // ✅ Écoute session sélectionnée depuis le sidebar
    this.subs.add(
      this.chatState.sessionId$
        .pipe(distinctUntilChanged())
        .subscribe((id: string | null) => {
          if (id === null) {
            this.resetChat();
          } else if (id !== this.sessionId) {
            this.loadSession(id);
          }
        })
    );
  }

  ngOnDestroy(): void {
    this.streamSub?.unsubscribe();
    this.subs.unsubscribe();
  }

  ngAfterViewChecked(): void {
    if (this.shouldScroll) {
      this.scrollToBottom();
      this.shouldScroll = false;
    }
  }

  // ── Sessions ──────────────────────────────────────────────────

  loadSessions(autoLoadLast = false): void {
    this.chatService.getUserSessions().subscribe({
      next: res => {
        const sorted = res
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 20);

        this.chatState.setSessions(sorted);

        if (autoLoadLast && sorted.length > 0 && !this.sessionId) {
          this.chatState.setSessionId(sorted[0].id);
        }
      },
      error: () => this.chatState.setSessions([])
    });
  }

  resetChat(): void {
    this.streamSub?.unsubscribe();
    this.isLoading = false;
    this.messages  = [];
    this.sessionId = null;
    this.error     = '';
    this.inputText = '';
  }

  loadSession(id: string): void {
    this.streamSub?.unsubscribe();
    this.isLoading = false;
    this.sessionId = id;
    this.error     = '';

    this.chatService.getHistory(id).subscribe({
      next: res => {
        this.messages = res.map(m => ({
          role:      m.role,
          content:   m.content,
          timestamp: new Date(m.createdAt),
          messageId: m.id,
          sources:   []
        }));
        this.shouldScroll = true;
      },
      error: () => {
        this.error    = 'Impossible de charger cette session.';
        this.messages = [];
      }
    });
  }

  // ── Send message ──────────────────────────────────────────────

  sendMessage(question?: string): void {
    const text = (question ?? this.inputText).trim();
    if (!text || this.isLoading) return;

    this.inputText = '';
    this.isLoading = true;
    this.error     = '';

    const firstMessage = text;
    this.messages.push({ role: 'user', content: text, timestamp: new Date() });

    const assistantMsg: ChatMessage = {
      role: 'assistant', content: '', timestamp: new Date(), sources: [], isStreaming: true
    };
    this.messages.push(assistantMsg);
    this.shouldScroll = true;

    this.streamSub?.unsubscribe();
    this.streamSub = this.chatService
      .sendMessageStream({ sessionId: this.sessionId ?? null, message: text })
      .subscribe({
        next: (token: string) => {
          if (token.startsWith('[SESSION:')) {
            const newId = token.slice(9, -1);
            this.sessionId = newId;
            this.chatState.setSessionId(newId);
            const currentSessions = this.chatState.sessions$.getValue();
            this.chatState.setSessions([
              { id: newId, title: firstMessage.slice(0, 40), createdAt: new Date().toISOString(), messages: [] },
              ...currentSessions
            ]);
            return;
          }
          if (token.startsWith('[SOURCES]')) {
            try {
              assistantMsg.sources = JSON.parse(token.slice(9));
              if (assistantMsg.sources?.length) assistantMsg.confidence = assistantMsg.sources[0].score;
            } catch {}
            return;
          }
          if (token.startsWith('[MESSAGE_ID:')) {
            assistantMsg.messageId = token.slice(12, -1);
            return;
          }
          assistantMsg.content += token;
          this.shouldScroll = true;
        },
        error: (err: Error) => {
          assistantMsg.isStreaming = false;
          assistantMsg.content += assistantMsg.content ? '\n\n_Erreur._' : '_Erreur._';
          this.error     = err.message;
          this.isLoading = false;
        },
        complete: () => {
          assistantMsg.isStreaming = false;
          this.isLoading = false;
          this.loadSessions();
          this.shouldScroll = true;
        }
      });
  }

  // ── Feedback ──────────────────────────────────────────────────

  openFeedbackModal(msg: ChatMessage, isPositive: boolean): void {
    if (msg.liked || msg.disliked) return;
    this.pendingFeedbackMsg = msg;
    this.feedbackIsPositive = isPositive;
    this.showFeedbackModal  = true;
  }

  onFeedbackConfirmed(result: FeedbackResult): void {
    const msg = this.pendingFeedbackMsg;
    if (!msg || !msg.messageId) { this.showFeedbackModal = false; return; }
    msg.liked    = this.feedbackIsPositive;
    msg.disliked = !this.feedbackIsPositive;
    this.showFeedbackModal  = false;
    this.pendingFeedbackMsg = null;
    this.feedbackService.submitFeedback({
      messageId: msg.messageId, score: result.score, comment: result.comment
    }).subscribe({ error: () => { msg.liked = false; msg.disliked = false; } });
  }

  onFeedbackCancelled(): void {
    this.showFeedbackModal  = false;
    this.pendingFeedbackMsg = null;
  }

  // ── Helpers ───────────────────────────────────────────────────

  onKeyDown(e: KeyboardEvent): void {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); this.sendMessage(); }
  }

  trackByIndex(i: number) { return i; }

  loadSuggestions(): void {
    this.suggestions = ["Qu'est-ce que RAG ?", "Comment fonctionne Angular ?", "Explique SQL vector search"];
  }

  loadDocumentsCount(): void {
    this.documentService.getDocuments().subscribe({
      next:  docs => this.documentsCount = docs.length,
      error: ()   => this.documentsCount = 0
    });
  }

  private scrollToBottom(): void {
    try {
      this.scrollContainer.nativeElement.scrollTop = this.scrollContainer.nativeElement.scrollHeight;
    } catch {}
  }
}