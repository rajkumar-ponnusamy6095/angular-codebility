
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { PlainNavbar } from '../../core/layout/plain-navbar/plain-navbar';
import { AuthService } from '../../core/auth/auth.service';
import { DEPARTMENTS, DEPARTMENT_PATTERN } from '../../core/models/department';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, PlainNavbar],
  templateUrl: './register.html',
  styleUrl: './register.css',
})
export class Register {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly isSubmitting = signal(false);
  readonly errorMessage = signal('');
  readonly departments = DEPARTMENTS;

  readonly registerForm = this.fb.nonNullable.group(
    {
      firstName: ['', [Validators.required, Validators.pattern(/\S/)]],
      lastName: ['', [Validators.required, Validators.pattern(/\S/)]],
      email: ['', [Validators.required, Validators.email]],
      gender: ['', Validators.required],
      phone: ['', [Validators.required, Validators.pattern(/^\+?[0-9][0-9\s().-]{5,18}[0-9]$/)]],
      department: ['', [Validators.required, Validators.pattern(DEPARTMENT_PATTERN)]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required],
      acceptTerms: [false, Validators.requiredTrue],
    },
    {
      validators: [
        (group) => {
          const password = group.get('password')?.value;
          const confirmPassword = group.get('confirmPassword')?.value;

          return !confirmPassword || password === confirmPassword
            ? null
            : { passwordMismatch: true };
        },
      ],
    },
  );

  get controls() {
    return this.registerForm.controls;
  }

  onSubmit(): void {
    this.errorMessage.set('');

    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    if (this.isSubmitting()) {
      return;
    }

    this.isSubmitting.set(true);
    this.auth.register(this.registerForm.getRawValue()).pipe(
      finalize(() => this.isSubmitting.set(false)),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: () => {
        void this.router.navigate(['/login'], {
          state: { registrationMessage: 'Registration successful, please check your email for verification instructions' }
        });
      },
      error: (error: unknown) => {
        this.errorMessage.set(error instanceof Error
          ? error.message
          : 'Failed to create your account. Please try again.');
      }
    });
  }
}
