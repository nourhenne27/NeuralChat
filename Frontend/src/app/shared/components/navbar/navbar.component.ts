import {
  Component,
  OnInit,
  OnDestroy,
  ElementRef,
  ViewChild
} from '@angular/core';

import { Router, NavigationEnd, Event as RouterEvent } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil, filter } from 'rxjs/operators';

import { AuthService } from '../../../core/services/auth.service';
import { AuthResponseDto } from '../../../core/models/auth-response';

const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB avant resize
const AVATAR_SIZE   = 128;
const JPEG_QUALITY  = 0.80;

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent implements OnInit, OnDestroy {

  currentUser: AuthResponseDto | null = null;
  avatarUrl: string | null = null;
  pageTitle = 'Chat IA';

  private destroy$ = new Subject<void>();

  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  constructor(
    public authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.updateTitle(this.router.url);

    this.router.events
      .pipe(
        filter((e: RouterEvent): e is NavigationEnd => e instanceof NavigationEnd),
        takeUntil(this.destroy$)
      )
      .subscribe(e => this.updateTitle(e.urlAfterRedirects));

    this.authService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        this.currentUser = user;
        if (user?.userId) {
          this.avatarUrl = localStorage.getItem(`avatar_${user.userId}`);
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private updateTitle(url: string): void {
    if (url.includes('/admin'))      this.pageTitle = 'Administration';
    else if (url.includes('/documents')) this.pageTitle = 'Documents';
    else                             this.pageTitle = 'Chat IA';
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/auth/login']);
  }

  isAdmin(): boolean {
    return this.currentUser?.role === 'Admin';
  }

  isAdminOrManager(): boolean {
    return this.currentUser?.role === 'Admin' ||
           this.currentUser?.role === 'Manager';
  }

  openFilePicker(): void {
    this.fileInput.nativeElement.click();
  }

  onFileSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    // Validation MIME stricte (whitelist, pas startsWith)
    if (!ALLOWED_MIME.includes(file.type)) return;

    // Validation taille fichier source
    if (file.size > MAX_FILE_SIZE) return;

    const reader = new FileReader();

    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      const img = new Image();

      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width  = AVATAR_SIZE;
        canvas.height = AVATAR_SIZE;

        const ctx = canvas.getContext('2d')!;
        const min = Math.min(img.width, img.height);
        const sx  = (img.width  - min) / 2;
        const sy  = (img.height - min) / 2;

        ctx.drawImage(img, sx, sy, min, min, 0, 0, AVATAR_SIZE, AVATAR_SIZE);

        const resized = canvas.toDataURL('image/jpeg', JPEG_QUALITY);

        this.avatarUrl = resized;

        if (this.currentUser?.userId) {
          try {
            localStorage.setItem(`avatar_${this.currentUser.userId}`, resized);
          } catch {
            // localStorage plein — on garde l'avatar en mémoire sans persister
          }
        }
      };

      img.src = dataUrl;
    };

    reader.readAsDataURL(file);
    (event.target as HTMLInputElement).value = '';
  }

  removeAvatar(event: MouseEvent): void {
    event.stopPropagation();
    this.avatarUrl = null;
    if (this.currentUser?.userId) {
      localStorage.removeItem(`avatar_${this.currentUser.userId}`);
    }
  }
}