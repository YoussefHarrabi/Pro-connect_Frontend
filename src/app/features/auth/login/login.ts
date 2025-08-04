import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AuthenticationRequest } from '../../../core/dto';
import { AuthService } from '../../../core/services/auth';


@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TranslateModule
  ],
  templateUrl: './login.html',
  styleUrl: './login.scss'
})
export class Login implements OnInit {
  loginForm!: FormGroup;
  hidePassword = true;
  isLoading = false;
  isLoginSuccess = false;
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private authService: AuthService,
    public translate: TranslateService
  ) {}

  ngOnInit(): void {
    this.initializeForm();
  }

  private initializeForm(): void {
    this.loginForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      rememberMe: [false]
    });
  }

  onSubmit(): void {
    if (this.loginForm.valid) {
      this.isLoading = true;
      this.isLoginSuccess = false;
      this.errorMessage = '';

      const credentials: AuthenticationRequest = {
        username: this.loginForm.value.username,
        password: this.loginForm.value.password
      };

      console.log('Login attempt:', credentials);

      this.authService.login(credentials).subscribe({
        next: (response) => {
          this.isLoading = false;
          this.isLoginSuccess = true;
          console.log('Login successful:', response);

          // Show success state for 1 second, then redirect based on role
          setTimeout(() => {
            const redirectUrl = this.authService.getRedirectUrlByRole(response.role);
            this.router.navigate([redirectUrl]);
          }, 1000);
        },
        error: (error) => {
          this.isLoading = false;
          this.errorMessage = error.message || 'Login failed. Please try again.';
          console.error('Login failed:', error);
        }
      });
    } else {
      this.markFormGroupTouched();
    }
  }

  private markFormGroupTouched(): void {
    Object.keys(this.loginForm.controls).forEach(key => {
      const control = this.loginForm.get(key);
      control?.markAsTouched();
    });
  }

  togglePasswordVisibility(): void {
    this.hidePassword = !this.hidePassword;
  }

  onForgotPassword(): void {
    alert(this.translate.instant('forgotPasswordAlert'));
  }

  onRegister(): void {
    this.router.navigate(['/auth/register']);
  }

  toggleLanguage(): void {
    const newLang = this.translate.currentLang === 'en' ? 'fr' : 'en';
    this.translate.use(newLang);
  }

  getErrorMessage(fieldName: string): string {
    const control = this.loginForm.get(fieldName);
    if (control?.hasError('required')) {
      return this.translate.instant('errors.required', { field: this.translate.instant(fieldName) });
    }
    if (control?.hasError('minlength')) {
      return this.translate.instant('errors.minLength', { 
        field: this.translate.instant(fieldName),
        length: control.errors?.['minlength']?.requiredLength 
      });
    }
    return '';
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.loginForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }
}