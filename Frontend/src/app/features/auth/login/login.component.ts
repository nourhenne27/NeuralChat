import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ChatStateService } from '../../../core/services/chat-state.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {

  form: FormGroup;
  error        = '';
  isLoading    = false;
  showPassword = false;

  constructor(
    private fb:          FormBuilder,
    private authService: AuthService,
    private chatState:   ChatStateService,
    private router:      Router
  ) {
    this.form = this.fb.group({
      email:    ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(1)]]
    });
  }

  get emailError(): string {
    const ctrl = this.form.get('email');
    if (ctrl?.hasError('required')) return 'Email requis.';
    if (ctrl?.hasError('email'))    return 'Email invalide.';
    return '';
  }

  get passwordError(): string {
    const ctrl = this.form.get('password');
    if (ctrl?.hasError('required')) return 'Mot de passe requis.';
    return '';
  }

  onSubmit(): void {
    if (this.form.invalid) return;
    this.isLoading = true;
    this.error     = '';

    const { email, password } = this.form.value;

    this.authService.login({ email, password }).subscribe({
      next: () => {
        this.chatState.setSessions([]);
this.chatState.setSessionId(null);
        this.router.navigate(['/chat']);
      },
      error: (err) => {
        this.error     = err?.error?.message || 'Email ou mot de passe incorrect.';
        this.isLoading = false;
      }
    });
  }
}