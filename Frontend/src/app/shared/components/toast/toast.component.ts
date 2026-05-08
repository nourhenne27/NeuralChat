import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { ToastService } from '../../../core/services/toast.service';

export interface ToastData {
  icon: string;
  message: string;
  type?: 'success' | 'error' | 'info';
  duration?: number;
}

@Component({
  selector: 'app-toast',
  templateUrl: './toast.component.html',
  styleUrls: ['./toast.component.scss']
})
export class ToastComponent implements OnInit, OnDestroy {

  visible = false;
  data: ToastData | null = null;

  // ✅ Pour cleanup des subscriptions
  private destroy$ = new Subject<void>();

  // ✅ Pour gérer le timeout actif
  private hideTimer?: ReturnType<typeof setTimeout>;

  constructor(private toastService: ToastService) {}

  ngOnInit(): void {
    this.toastService.toastState$
      .pipe(takeUntil(this.destroy$))
      .subscribe((toast: ToastData | null) => {

        if (!toast) return;

        // ✅ Annuler l'ancien timer si un nouveau toast arrive
        clearTimeout(this.hideTimer);

        this.data = toast;
        this.visible = true;

        const duration = toast.duration ?? 3000;

        // ✅ Sauvegarder le nouveau timer
        this.hideTimer = setTimeout(() => {
          this.visible = false;
        }, duration);
      });
  }

  ngOnDestroy(): void {

    // ✅ Cleanup timer
    clearTimeout(this.hideTimer);

    // ✅ Cleanup subscription
    this.destroy$.next();
    this.destroy$.complete();
  }

  get typeClass(): string {
    switch (this.data?.type) {
      case 'success':
        return 'toast-success';

      case 'error':
        return 'toast-error';

      case 'info':
        return 'toast-info';

      default:
        return 'toast-success';
    }
  }
}