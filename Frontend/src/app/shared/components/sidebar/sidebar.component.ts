import { Component, OnInit, OnDestroy, ViewEncapsulation } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { Subscription } from 'rxjs';
import { AuthService }      from '../../../core/services/auth.service';
import { ChatStateService } from '../../../core/services/chat-state.service';
import { ChatService }      from '../../../core/services/chat.service';
import { ChatSessionDto }   from '../../../core/models/chat-message';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class SidebarComponent implements OnInit, OnDestroy {

  activePage = 'chat';
  isAdmin = false;
  sessions: ChatSessionDto[] = [];
  activeSessionId: string | null = null;
  isChatPage = false;

  // Delete
  confirmDeleteId: string | null = null;

  // Rename
  editingSessionId: string | null = null;
  editingTitle     = '';

  private subs = new Subscription();

  constructor(
    private router: Router,
    private authService: AuthService,
    private chatState: ChatStateService,
    private chatService: ChatService
  ) { }

  ngOnInit(): void {
    this.isAdmin = this.authService.isAdminOrManager();

    const url = this.router.url;
    this.isChatPage = url.includes('/chat');
    if (url.includes('/chat')) this.activePage = 'chat';
    else if (url.includes('/documents')) this.activePage = 'docs';
    else if (url.includes('/admin')) this.activePage = 'admin';

    this.subs.add(
      this.router.events
        .pipe(filter(e => e instanceof NavigationEnd))
        .subscribe((e: any) => {
          const u = e.urlAfterRedirects as string;
          this.isChatPage = u.includes('/chat');
          if (u.includes('/chat')) this.activePage = 'chat';
          else if (u.includes('/documents')) this.activePage = 'docs';
          else if (u.includes('/admin')) this.activePage = 'admin';
        })
    );

    this.subs.add(
      this.chatState.sessions$.subscribe((s: ChatSessionDto[]) => this.sessions = s)
    );

    this.subs.add(
      this.chatState.sessionId$.subscribe((id: string | null) => this.activeSessionId = id)
    );
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  navigate(page: string): void {
    this.activePage = page;
    const routes: Record<string, string> = { chat: '/chat', docs: '/documents', admin: '/admin/dashboard' };
    this.router.navigate([routes[page] ?? '/chat']);
  }

  selectSession(id: string): void {
    if (this.editingSessionId === id) return; // Don't switch while editing
    this.router.navigate(['/chat']).then(() => {
      this.chatState.selectSession(id);
    });
  }

  newChat(): void {
    this.router.navigate(['/chat']).then(() => {
      this.chatState.triggerNewChat();
    });
  }

  // ── Delete ────────────────────────────────────────────────
  onDeleteClick(event: MouseEvent, id: string): void {
    event.stopPropagation();
    this.confirmDeleteId = id;
  }

  cancelDelete(): void {
    this.confirmDeleteId = null;
  }

  confirmDelete(): void {
    if (!this.confirmDeleteId) return;
    const id = this.confirmDeleteId;
    this.confirmDeleteId = null;

    this.chatService.deleteSession(id).subscribe({
      next: () => {
        const updated = this.chatState.sessions$.getValue().filter(s => s.id !== id);
        this.chatState.setSessions(updated);
        if (this.activeSessionId === id) this.chatState.triggerNewChat();
      },
      error: (err) => console.error('Delete error:', err)
    });
  }

  // ── Rename ────────────────────────────────────────────────
  startRename(event: MouseEvent, session: ChatSessionDto): void {
    event.stopPropagation();
    this.editingSessionId = session.id;
    this.editingTitle     = session.title || '';
  }

  confirmRename(sessionId: string): void {
    const title = this.editingTitle.trim();
    if (!title) { this.cancelRename(); return; }

    this.chatService.renameSession(sessionId, title).subscribe({
      next: () => {
        const updated = this.chatState.sessions$.getValue().map(s =>
          s.id === sessionId ? { ...s, title } : s
        );
        this.chatState.setSessions(updated);
      },
      error: (err) => console.error('Rename error:', err)
    });

    this.editingSessionId = null;
    this.editingTitle     = '';
  }

  cancelRename(): void {
    this.editingSessionId = null;
    this.editingTitle     = '';
  }

  onRenameKeydown(event: KeyboardEvent, sessionId: string): void {
    if (event.key === 'Enter')  { event.preventDefault(); this.confirmRename(sessionId); }
    if (event.key === 'Escape') { this.cancelRename(); }
  }
}