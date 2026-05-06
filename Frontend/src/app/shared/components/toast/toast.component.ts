
import { Component, OnInit } from '@angular/core';
import { ToastService } from '../../../core/services/toast.service';

export interface ToastData {
  icon: string;
  message: string;
  type?: 'success' | 'error' | 'info';
  duration?: number;
}

@Component({
  selector: 'app-toast',
  template: `
    <div class="toast" [class.show]="visible" [ngClass]="typeClass">
      <div class="toast-icon">{{ data?.icon }}</div>
      <div class="toast-message">{{ data?.message }}</div>
    </div>
  `,
  styleUrls: ['./toast.component.scss']
})
export class ToastComponent implements OnInit {

  visible = false;
  data: ToastData | null = null;

  constructor(private toastService: ToastService) {}

  ngOnInit(): void {
    this.toastService.toastState$.subscribe((toast: ToastData | null) => {
      if (!toast) return;

      this.data = toast;
      this.visible = true;

      const duration = toast.duration ?? 3000;

      setTimeout(() => {
        this.visible = false;
      }, duration);
    });
  }

  get typeClass(): string {
    switch (this.data?.type) {
      case 'success': return 'toast-success';
      case 'error': return 'toast-error';
      case 'info': return 'toast-info';
      default: return 'toast-success';
    }
  }
}