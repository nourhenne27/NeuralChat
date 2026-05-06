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
  confirmDeleteId: string | null = null; // ✅

  private subs = new Subscription();

  constructor(
    private router: Router,
    private authService: AuthService,
    private chatState: ChatStateService,
    private chatService: ChatService       // ✅
  ) { }

  ngOnInit(): void {
    this.isAdmin = this.authService.isAdmin();

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
    const routes: Record<string, string> = { chat: '/chat', docs: '/documents', admin: '/admin' };
    this.router.navigate([routes[page]]);
  }

  selectSession(id: string): void {
    this.router.navigate(['/chat']).then(() => {
      this.chatState.selectSession(id);
    });
  }

  newChat(): void {
    this.router.navigate(['/chat']).then(() => {
      this.chatState.triggerNewChat();
    });
  }

  // ✅ Delete handlers
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

    console.log('🗑️ Deleting session:', id);

    this.chatService.deleteSession(id).subscribe({
      next: () => {
        console.log('✅ Delete success');
        const updated = this.chatState.sessions$.getValue().filter(s => s.id !== id);
        this.chatState.setSessions(updated);
        if (this.activeSessionId === id) {
          this.chatState.triggerNewChat();
        }
      },
      error: (err) => {
        console.error('❌ Delete error:', err);
      }
    });
  }
}