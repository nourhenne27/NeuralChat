import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent {

  form: FormGroup;
  error = '';
  isLoading = false;
  showPassword = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.form = this.fb.group({
      email:    ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
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
    if (ctrl?.hasError('required'))   return 'Mot de passe requis.';
    if (ctrl?.hasError('minlength'))  return 'Minimum 6 caractères.';
    return '';
  }

  onSubmit(): void {
    if (this.form.invalid) return;
    this.isLoading = true;
    this.error = '';

    const { email, password } = this.form.value;

    this.authService.register({ email, password, role: 'User' }).subscribe({
      next: () => this.router.navigate(['/chat']),
      error: (err) => {
        this.error = err?.error?.message || 'Erreur lors de la création du compte.';
        this.isLoading = false;
      }
    });
  }
}