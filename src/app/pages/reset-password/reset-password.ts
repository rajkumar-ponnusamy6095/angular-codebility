
import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { PlainNavbar } from '../../core/layout/plain-navbar/plain-navbar';
import { AuthService } from '../../core/auth/auth.service';

type TokenStatus = 'validating' | 'ready' | 'invalid' | 'success';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, PlainNavbar],
  templateUrl: './reset-password.html',
  styleUrl: './reset-password.css',
})
export class ResetPassword implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly auth = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);

  readonly token = this.route.snapshot.queryParamMap.get('token')?.trim() ?? '';

  readonly tokenStatus = signal<TokenStatus>(this.token ? 'validating' : 'invalid');

  readonly errorMessage = signal(this.token
    ? ''
    : 'The password reset link is missing its token.');

  readonly successMessage = signal('');
  readonly isSubmitting = signal(false);

  ngOnInit(): void {
    if (!this.token) {
      return;
    }

    this.auth.validateResetToken(this.token).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: message => {
        this.tokenStatus.set('ready');
        this.successMessage.set(message);
        this.errorMessage.set('');
      },
      error: (error: unknown) => {
        this.tokenStatus.set('invalid');
        this.errorMessage.set(error instanceof Error
          ? error.message
          : 'This password reset link is invalid or expired.');
      }
    });
  }

  readonly resetPasswordForm = this.fb.nonNullable.group(
    {
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]],
    },
    {
      validators: [
        (group) => {
          const password = group.get('password')?.value;
          const confirmPassword = group.get('confirmPassword')?.value;

          if (!confirmPassword || password === confirmPassword) {
            return null;
          }

          return { passwordMismatch: true };
        },
      ],
    },
  );

  get password() {
    return this.resetPasswordForm.controls.password;
  }

  get confirmPassword() {
    return this.resetPasswordForm.controls.confirmPassword;
  }

  onSubmit(): void {
    this.errorMessage.set('');
    this.successMessage.set('');

    if (this.resetPasswordForm.invalid) {
      this.resetPasswordForm.markAllAsTouched();
      return;
    }

    if (this.isSubmitting() || this.tokenStatus() !== 'ready') {
      return;
    }

    this.isSubmitting.set(true);
    this.auth.resetPassword(
      this.token,
      this.password.value,
      this.confirmPassword.value
    ).pipe(
      finalize(() => this.isSubmitting.set(false)),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: message => {
        this.tokenStatus.set('success');
        this.successMessage.set(message);
        this.errorMessage.set('');
      },
      error: (error: unknown) => {
        this.errorMessage.set(error instanceof Error
          ? error.message
          : 'Failed to reset the password.');
      }
    });
  }
}
