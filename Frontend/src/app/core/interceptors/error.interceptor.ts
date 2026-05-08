import { Injectable } from '@angular/core';
import {
  HttpInterceptor, HttpRequest, HttpHandler,
  HttpEvent, HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {

  constructor(
    private router: Router,
    private authService: AuthService,
    private toast: ToastService
  ) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(req).pipe(
      catchError((error: HttpErrorResponse) => {

        let message = 'Une erreur inattendue est survenue.';

        if (error.status === 401) {
          this.authService.logout();
          this.router.navigate(['/auth/login']);
          message = 'Session expirée. Veuillez vous reconnecter.';
        }
        else if (error.status === 403) {
          this.router.navigate(['/chat']);
          message = 'Accès refusé. Droits insuffisants.';
        }
        else if (error.status === 400) {
          if (error.error?.errors) {
            const firstField = Object.values(error.error.errors)[0] as string[];
            message = firstField?.[0] ?? 'Données invalides.';
          } else if (error.error?.message) {
            message = error.error.message;
          } else if (typeof error.error === 'string') {
            message = error.error;
          } else {
            message = 'Données invalides.';
          }
        }
        else if (error.status === 404) {
          message = 'Ressource introuvable.';
        }
        else if (error.status >= 500) {
          message = 'Erreur serveur. Réessayez dans un instant.';
        }
        else if (error.status === 0) {
          message = 'Impossible de joindre le serveur. Vérifiez votre connexion.';
        }

        this.toast.error(message);

        return throwError(() => new Error(message));
      })
    );
  }
}