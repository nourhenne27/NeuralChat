import {
  Component, OnInit, OnDestroy, ViewChild, ElementRef, ChangeDetectorRef
} from '@angular/core';
import { Subscription } from 'rxjs';
import { distinctUntilChanged } from 'rxjs/operators';
import { ChatService }      from '../../../core/services/chat.service';
import { ChatStateService } from '../../../core/services/chat-state.service';
import { ChatMessage, ChatSessionDto, SourceDto } from '../../../core/models/chat-message';
import { DocumentService } from '../../../core/services/document.service';
import { FeedbackService } from '../../../core/services/feedback.service';
import { FeedbackResult }  from '../feedback-modal/feedback-modal.component';

@Component({
  selector:    'app-chat-window',
  templateUrl: './chat-window.component.html',
  styleUrls:   ['./chat-window.component.scss']
})
export class ChatWindowComponent implements OnInit, OnDestroy {

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

  private streamSub?:    Subscription;
  private subs =         new Subscription();
  private shouldScroll = false;
  private isStreaming =  false;
  private sessionLoadedFromSessions = false;

  constructor(
    private chatService:     ChatService,
    private chatState:       ChatStateService,
    private documentService: DocumentService,
    private feedbackService: FeedbackService,
    private cdr:             ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadSuggestions();
    this.loadDocumentsCount();
    this.loadSessions(true);

    this.subs.add(
      this.chatState.sessionId$
        .pipe(distinctUntilChanged())
        .subscribe((id: string | null) => {
          if (id === null) {
            this.resetChat();
          } else if (id !== this.sessionId && !this.isStreaming) {
            if (this.sessionLoadedFromSessions && id === this.sessionId) {
              this.sessionLoadedFromSessions = false;
              return;
            }
            this.sessionLoadedFromSessions = false;
            this.loadSession(id);
          } else if (id !== this.sessionId && this.isStreaming) {
            this.sessionId = id;
          }
        })
    );
  }

  ngOnDestroy(): void {
    this.streamSub?.unsubscribe();
    this.subs.unsubscribe();
  }

  private scheduleScroll(): void {
    if (this.shouldScroll) return;
    this.shouldScroll = true;
    requestAnimationFrame(() => {
      this.scrollToBottom();
      this.shouldScroll = false;
    });
  }

  loadSessions(autoLoadLast = false): void {
    this.chatService.getUserSessions().subscribe({
      next: res => {
        const sorted = res
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 20);

        this.chatState.setSessions(sorted);

        if (autoLoadLast && sorted.length > 0 && !this.sessionId) {
          const first = sorted[0];
          this.sessionId = first.id;

          this.chatService.getHistory(first.id).subscribe({
            next: msgs => {
              this.messages = this.mapMessages(msgs);
              this.scheduleScroll();
              this.sessionLoadedFromSessions = true;
              this.chatState.setSessionId(first.id);
            },
            error: () => {
              this.messages = this.mapMessages(first.messages);
              this.scheduleScroll();
              this.sessionLoadedFromSessions = true;
              this.chatState.setSessionId(first.id);
            }
          });
        }
      },
      error: () => this.chatState.setSessions([])
    });
  }

  resetChat(): void {
    this.streamSub?.unsubscribe();
    this.isLoading   = false;
    this.isStreaming  = false;
    this.messages    = [];
    this.sessionId   = null;
    this.error       = '';
    this.inputText   = '';
    this.sessionLoadedFromSessions = false;
  }

  loadSession(id: string): void {
    this.streamSub?.unsubscribe();
    this.isLoading   = false;
    this.isStreaming  = false;
    this.sessionId   = id;
    this.error       = '';
    this.messages    = [];

    this.chatService.getHistory(id).subscribe({
      next: res => {
        this.messages = this.mapMessages(res);
        this.scheduleScroll();
      },
      error: () => {
        this.error    = 'Impossible de charger cette session.';
        this.messages = [];
      }
    });
  }

private mapMessages(msgs: any[]): ChatMessage[] {
  return msgs
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    .map(m => {
      const fb = this.restoreFeedback(m.id);
      const sources = this.normalizeSources(m.sources);
      return {
        role:      m.role,
        content:   m.content,
        timestamp: new Date(m.createdAt),
        messageId: m.id,
        sources:   sources.length ? [...sources] : [], // ✅ nouvelle référence tableau
        liked:     fb.liked,
        disliked:  fb.disliked,
        hasAnswer: m.role === 'assistant' && !!m.content // ✅ hasAnswer défini au refresh
      };
    });
}

  sendMessage(question?: string): void {
    const text = (question ?? this.inputText).trim();
    if (!text || this.isLoading) return;

    this.inputText   = '';
    this.isLoading   = true;
    this.isStreaming  = true;
    this.error       = '';

    const firstMessage = text;
    this.messages.push({ role: 'user', content: text, timestamp: new Date() });

    const assistantMsg: ChatMessage = {
      role: 'assistant', content: '', timestamp: new Date(), sources: undefined, isStreaming: true
    };
    this.messages.push(assistantMsg);
    this.messages = [...this.messages];
    this.scheduleScroll();

    this.streamSub?.unsubscribe();
    this.streamSub = this.chatService
      .sendMessageStream({ sessionId: this.sessionId ?? null, message: text })
      .subscribe({
        next: (token: string) => {
          if (token.startsWith('[SESSION:')) {
            const newId = token.slice(9, -1);
            this.sessionId = newId;
            const currentSessions = this.chatState.getSessions();
            this.chatState.setSessions([
              { id: newId, title: firstMessage.slice(0, 40), createdAt: new Date().toISOString(), messages: [] },
              ...currentSessions
            ]);
            return;
          }
          if (token.startsWith('[SOURCES]')) {
            try {
              const parsed: SourceDto[] = JSON.parse(token.slice(9));
              assistantMsg.sources = this.normalizeSources(parsed);
            } catch {
              assistantMsg.sources = [];
            }
            this.messages = [...this.messages];
            this.cdr.detectChanges();
            return;
          }
          if (token.startsWith('[MESSAGE_ID:')) {
            assistantMsg.messageId = token.slice(12, -1);
            return;
          }
          assistantMsg.content += token;
          this.messages = [...this.messages];
          this.scheduleScroll();
          this.cdr.detectChanges();
        },
        error: (err: Error) => {
          assistantMsg.isStreaming = false;
          assistantMsg.content += assistantMsg.content ? '\n\n_Erreur._' : '_Erreur._';
          this.messages    = [...this.messages];
          this.error       = err.message;
          this.isLoading   = false;
          this.isStreaming  = false;
        },
        complete: () => {
          assistantMsg.isStreaming = false;

          const content = assistantMsg.content.toLowerCase();
          const noAnswerPhrases = [
            'je ne trouve pas',
            'je n\'ai pas trouvé',
            'je n\'ai trouvé aucune',
            'could not find',
            'i could not find',
            'no information',
            'aucune information',
            'pas d\'information',
            'je ne peux pas comprendre',
            'puis-je vous aider avec autre chose',
          ];

          assistantMsg.hasAnswer = !!assistantMsg.content &&
            !noAnswerPhrases.some(phrase => content.includes(phrase));

          this.messages   = [...this.messages];
          this.isLoading  = false;
          this.isStreaming = false;
          this.scheduleScroll();
        }
      });
  }

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
    this.saveFeedback(msg.messageId!, this.feedbackIsPositive);
    this.showFeedbackModal  = false;
    this.pendingFeedbackMsg = null;
    this.feedbackService.submitFeedback({
      messageId: msg.messageId, score: result.score, comment: result.comment
    }).subscribe({
      error: () => {
        msg.liked = false;
        msg.disliked = false;
        try { localStorage.removeItem(this.feedbackKey(msg.messageId!)); } catch {}
      }
    });
  }

  onFeedbackCancelled(): void {
    this.showFeedbackModal  = false;
    this.pendingFeedbackMsg = null;
  }

  onKeyDown(e: KeyboardEvent): void {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); this.sendMessage(); }
  }

  trackByMessage(i: number, msg: ChatMessage): string | number {
    return msg.messageId ?? msg.timestamp?.getTime() ?? i;
  }

  loadSuggestions(): void {
    this.suggestions = ["Qu'est-ce que RAG ?", "Comment fonctionne Angular ?", "Explique SQL vector search"];
  }

  loadDocumentsCount(): void {
    this.documentService.getDocuments().subscribe({
      next:  docs => this.documentsCount = docs.length,
      error: ()   => this.documentsCount = 0
    });
  }

  private normalizeSources(sources: any[] | undefined): SourceDto[] {
    if (!sources?.length) return [];
    const seen = new Set<string>();
    return sources
      .map(s => ({
        documentTitle: s.documentTitle ?? s.DocumentTitle ?? s.title ?? s.name ?? '',
        excerpt:       s.excerpt       ?? s.Excerpt       ?? '',
        score:         s.score         ?? s.Score         ?? 0
      }))
      .filter(s => s.documentTitle !== '')
      .sort((a, b) => b.score - a.score)
      .filter(s => {
        if (seen.has(s.documentTitle)) return false;
        seen.add(s.documentTitle);
        return true;
      })
      .slice(0, 5);
  }

  private feedbackKey(messageId: string): string {
    return `feedback_${messageId}`;
  }

  private saveFeedback(messageId: string, liked: boolean): void {
    try { localStorage.setItem(this.feedbackKey(messageId), liked ? '1' : '0'); } catch {}
  }

  private restoreFeedback(messageId: string | undefined): { liked: boolean; disliked: boolean } {
    if (!messageId) return { liked: false, disliked: false };
    try {
      const val = localStorage.getItem(this.feedbackKey(messageId));
      if (val === null) return { liked: false, disliked: false };
      return val === '1' ? { liked: true, disliked: false } : { liked: false, disliked: true };
    } catch { return { liked: false, disliked: false }; }
  }

  private scrollToBottom(): void {
    try {
      this.scrollContainer.nativeElement.scrollTop =
        this.scrollContainer.nativeElement.scrollHeight;
    } catch {}
  }
} 
