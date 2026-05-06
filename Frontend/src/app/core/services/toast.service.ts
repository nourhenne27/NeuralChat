
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface ToastData {
  icon: string;
  message: string;
  type?: 'success' | 'error' | 'info';
  duration?: number;
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {

  
  private toastSubject = new BehaviorSubject<ToastData | null>(null);
  toastState$ = this.toastSubject.asObservable();


  show(toast: ToastData): void {
    this.toastSubject.next(toast);
  }


  success(message: string, duration = 3000): void {
    this.show({
      icon: '✓',
      message,
      type: 'success',
      duration
    });
  }

  
  error(message: string, duration = 4000): void {
    this.show({
      icon: '✕',
      message,
      type: 'error',
      duration
    });
  }

 
  info(message: string, duration = 3000): void {
    this.show({
      icon: 'ℹ',
      message,
      type: 'info',
      duration
    });
  }

 
  clear(): void {
    this.toastSubject.next(null);
  }
}