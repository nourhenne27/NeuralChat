import { Injectable } from '@angular/core';
import { Subject, BehaviorSubject } from 'rxjs';
import { RegisterModalResult } from '../../features/admin/register-modal.component';

@Injectable({ providedIn: 'root' })
export class ModalService {

  private result$!: Subject<RegisterModalResult | null>;

  // État observable que modal-host écoute
  isOpen$ = new BehaviorSubject<boolean>(false);
  loading$ = new BehaviorSubject<boolean>(false);

  openRegisterModal(): Subject<RegisterModalResult | null> {
    this.result$ = new Subject<RegisterModalResult | null>();
    this.loading$.next(false);
    this.isOpen$.next(true);
    return this.result$;
  }

  submit(data: RegisterModalResult): void {
    this.result$.next(data);
  }

  setLoading(loading: boolean): void {
    this.loading$.next(loading);
  }

  closeModal(): void {
    this.isOpen$.next(false);
    this.loading$.next(false);
    if (this.result$) {
      this.result$.next(null);
    }
  }
}