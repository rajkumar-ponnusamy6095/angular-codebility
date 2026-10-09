import { CommonModule } from '@angular/common';
import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators
} from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';

import { CurrentAccount } from '../../core/models/account';
import { DEPARTMENTS, DEPARTMENT_PATTERN } from '../../core/models/department';
import { AuthService } from '../../core/auth/auth.service';
import { UserProfileUpdateData } from '../users/user.model';
import { UserService } from '../users/user.service';

function phoneDigitsValidator(
  control: AbstractControl
): ValidationErrors | null {
  const value = String(control.value ?? '');
  const digits = value.replace(/\D/g, '');

  if (!value.trim()) {
    return null;
  }

  if (!/^\+?[\d\s()-]+$/.test(value)) {
    return { phoneFormat: true };
  }

  return digits.length >= 7 && digits.length <= 15
    ? null
    : { phoneLength: true };
}

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './profile.html',
  styleUrl: './profile.css'
})
export class Profile implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly users = inject(UserService);
  private readonly destroyRef = inject(DestroyRef);

  readonly account = signal<CurrentAccount | null>(null);
  readonly loading = signal(true);
  readonly loadError = signal('');
  readonly savingProfile = signal(false);
  readonly savingPassword = signal(false);
  readonly editingProfile = signal(false);
  readonly formError = signal('');
  readonly successMessage = signal('');
  readonly passwordError = signal('');
  readonly passwordSuccess = signal('');
  readonly departments = DEPARTMENTS;

  readonly profileForm = this.fb.nonNullable.group({
    firstName: [
      '',
      [Validators.required, Validators.minLength(2), Validators.maxLength(50), Validators.pattern(/\S/)]
    ],
    lastName: [
      '',
      [Validators.required, Validators.minLength(2), Validators.maxLength(50), Validators.pattern(/\S/)]
    ],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(254)]],
    phone: [
      '',
      [Validators.required, Validators.maxLength(20), phoneDigitsValidator]
    ],
    department: [
      '',
      [
        Validators.required,
        Validators.maxLength(80),
        Validators.pattern(DEPARTMENT_PATTERN)
      ]
    ]
  });

  readonly passwordForm = this.fb.nonNullable.group(
    {
      oldPassword: ['', Validators.required],
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required]
    },
    {
      validators: group => {
        const newPassword = group.get('newPassword')?.value;
        const confirmPassword = group.get('confirmPassword')?.value;
        const oldPassword = group.get('oldPassword')?.value;
        const errors: ValidationErrors = {};

        if (newPassword !== confirmPassword) {
          errors['passwordMismatch'] = true;
        }
        if (newPassword && newPassword === oldPassword) {
          errors['passwordUnchanged'] = true;
        }

        return Object.keys(errors).length > 0 ? errors : null;
      }
    }
  );

  ngOnInit(): void {
    this.loadAccount();
  }

  get userInitials(): string {
    return this.account()?.name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map(part => part.charAt(0).toUpperCase())
      .join('') || 'P';
  }

  loadAccount(): void {
    this.loading.set(true);
    this.loadError.set('');

    this.auth.getMe().pipe(
      finalize(() => this.loading.set(false)),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: account => {
        this.account.set(account);
        this.patchProfileForm(account);
      },
      error: (error: unknown) => {
        this.loadError.set(error instanceof Error
          ? error.message
          : 'Failed to load your account.');
      }
    });
  }

  startEditing(): void {
    const account = this.account();
    if (!account) {
      return;
    }

    this.patchProfileForm(account);
    this.formError.set('');
    this.successMessage.set('');
    this.editingProfile.set(true);
  }

  cancelEditing(): void {
    const account = this.account();
    if (account) {
      this.patchProfileForm(account);
    }
    this.formError.set('');
    this.editingProfile.set(false);
  }

  saveProfile(): void {
    const account = this.account();
    if (!account || this.savingProfile()) {
      return;
    }

    this.formError.set('');
    this.successMessage.set('');
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }

    const form = this.profileForm.getRawValue();
    const data: UserProfileUpdateData = {
      ...form,
      gender: account.gender,
      role: account.role === 'ADMIN' ? 'admin' : 'user',
      status: account.status
    };

    this.savingProfile.set(true);
    this.users.updateMyProfile(account.id, data).pipe(
      finalize(() => this.savingProfile.set(false)),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: updated => {
        const updatedAccount: CurrentAccount = {
          ...updated,
          role: updated.role === 'admin' ? 'ADMIN' : 'USER'
        };
        this.account.set(updatedAccount);
        this.auth.account.set(updatedAccount);
        this.patchProfileForm(updatedAccount);
        this.editingProfile.set(false);
        this.successMessage.set('Your profile has been updated.');
      },
      error: (error: unknown) => {
        this.formError.set(error instanceof Error
          ? error.message
          : 'Failed to update your profile.');
      }
    });
  }

  changePassword(): void {
    this.passwordError.set('');
    this.passwordSuccess.set('');

    if (this.passwordForm.invalid || this.savingPassword()) {
      this.passwordForm.markAllAsTouched();
      return;
    }

    this.savingPassword.set(true);
    this.auth.changePassword(this.passwordForm.getRawValue()).pipe(
      finalize(() => this.savingPassword.set(false)),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: () => {
        this.passwordSuccess.set('Your password was changed successfully.');
        this.passwordForm.reset();
      },
      error: (error: unknown) => {
        this.passwordError.set(error instanceof Error
          ? error.message
          : 'Failed to change your password.');
      }
    });
  }

  hasProfileError(
    field: keyof typeof this.profileForm.controls,
    error: string
  ): boolean {
    const control = this.profileForm.controls[field];
    return control.touched && control.hasError(error);
  }

  private patchProfileForm(account: CurrentAccount): void {
    this.profileForm.patchValue({
      firstName: account.firstName,
      lastName: account.lastName,
      email: account.email,
      phone: account.phone,
      department: account.department
    });
  }
}
