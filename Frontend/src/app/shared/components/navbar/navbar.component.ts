import { Component, OnInit, ElementRef, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { AuthResponseDto } from '../../../core/models/auth-response';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent implements OnInit {

  currentUser: AuthResponseDto | null = null;
  avatarUrl: string | null = null;

  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  constructor(
    public authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      if (user?.userId) {
        this.avatarUrl = localStorage.getItem(`avatar_${user.userId}`);
      }
    });
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/auth/login']);
  }

  isAdmin(): boolean { return this.currentUser?.role === 'Admin'; }

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
    if (!file.type.startsWith('image/')) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      // Resize to max 128x128 before storing
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const size = 128;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d')!;
        // Crop to square from center
        const min = Math.min(img.width, img.height);
        const sx = (img.width - min) / 2;
        const sy = (img.height - min) / 2;
        ctx.drawImage(img, sx, sy, min, min, 0, 0, size, size);
        const resized = canvas.toDataURL('image/jpeg', 0.85);
        this.avatarUrl = resized;
        if (this.currentUser?.userId) {
          localStorage.setItem(`avatar_${this.currentUser.userId}`, resized);
        }
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
    // Reset input so same file can be re-selected
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