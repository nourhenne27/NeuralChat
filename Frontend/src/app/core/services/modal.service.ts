import { Injectable, ApplicationRef, ComponentRef, createComponent, EnvironmentInjector } from '@angular/core';
import { Subject } from 'rxjs';
import { RegisterModalComponent, RegisterModalResult } from '../../features/admin/register-modal.component';

@Injectable({ providedIn: 'root' })
export class ModalService {

  private ref: ComponentRef<RegisterModalComponent> | null = null;
  private result$!: Subject<RegisterModalResult | null>;

  constructor(
    private appRef: ApplicationRef,
    private injector: EnvironmentInjector
  ) {}

  openRegisterModal(): Subject<RegisterModalResult | null> {
    this.destroy();

    this.result$ = new Subject<RegisterModalResult | null>();

    this.ref = createComponent(RegisterModalComponent, {
      environmentInjector: this.injector
    });

    this.ref.instance.onSubmit = (data) => {
      console.log('📤 Données envoyées au service:', data);
      this.result$.next(data);
      this.destroy();
    };

    this.ref.instance.onClose = () => {
      this.result$.next(null);
      this.destroy();
    };

    const portal = document.createElement('div');
    portal.id = 'modal-portal';
    Object.assign(portal.style, {
      position: 'fixed',
      inset: '0',
      zIndex: '2147483647',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    });

    document.body.appendChild(portal);
    document.body.style.overflow = 'hidden';

    this.appRef.attachView(this.ref.hostView);
    portal.appendChild(this.ref.location.nativeElement);
    this.ref.changeDetectorRef.detectChanges();

    // ✅ FIX : force Angular à rendre le template du composant dynamique
    this.ref.changeDetectorRef.detectChanges();

    return this.result$;
  }

  setLoading(loading: boolean): void {
    if (this.ref?.instance) {
      this.ref.instance.loading = loading;
      this.ref.changeDetectorRef.detectChanges();
    }
  }

  closeModal(): void {
    this.destroy();
  }

  private destroy(): void {
    document.body.style.overflow = '';
    if (this.ref) {
      this.appRef.detachView(this.ref.hostView);
      this.ref.destroy();
      this.ref = null;
    }
    document.getElementById('modal-portal')?.remove();
  }
}