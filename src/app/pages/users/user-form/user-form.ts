
import { CommonModule } from '@angular/common';
import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';

import { UserService } from '../user.service';
import { User, UserFormData, UserGender } from '../user.model';
import { DEPARTMENTS, DEPARTMENT_PATTERN } from '../../../core/models/department';

function phoneDigitsValidator(
  control: AbstractControl
): ValidationErrors | null {
  const value = String(control.value ?? '');
  const digits = value.replace(/\D/g, '');

  if (!value.trim()) {
    return null; // Validators.required handles this case.
  }

  if (!/^\+?[\d\s()-]+$/.test(value)) {
    return { phoneFormat: true };
  }

  return digits.length >= 7 && digits.length <= 15
    ? null
    : { phoneLength: true };
}

@Component({
  selector: 'app-user-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './user-form.html',
  styleUrl: './user-form.css'
})
export class UserForm implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly userService = inject(UserService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly loadError = signal('');
  readonly formError = signal('');
  readonly isEditing = signal(false);

  private editingUser: User | null = null;

  readonly genders: UserGender[] = ['male', 'female', 'other'];

  readonly departments = DEPARTMENTS;

  readonly form = this.fb.nonNullable.group({
    firstName: [
      '',
      [Validators.required, Validators.minLength(2)]
    ],
    lastName: [
      '',
      [Validators.required, Validators.minLength(2)]
    ],
    email: ['', [Validators.required, Validators.email]],
    gender: ['other' as UserGender, Validators.required],
    phone: ['', [Validators.required, phoneDigitsValidator]],
    department: ['', [Validators.required, Validators.pattern(DEPARTMENT_PATTERN)]],
    role: ['user' as 'user' | 'admin', Validators.required],
    status: ['active' as 'active' | 'inactive', Validators.required]
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');

    if (id !== null) {
      this.isEditing.set(true);
      this.loadUser(id);
    }
  }

  private loadUser(id: string): void {
    if (!id.trim()) {
      this.loadError.set('User not found.');
      return;
    }

    this.loading.set(true);
    this.loadError.set('');

    this.userService.getUser(id).pipe(
      finalize(() => this.loading.set(false)),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (user) => {
        this.editingUser = user;

        this.form.patchValue({
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          gender: user.gender.toLowerCase() as UserGender,
          phone: user.phone,
          department: user.department,
          role: user.role,
          status: user.status
        });
      },
      error: (error: unknown) => {
        this.loadError.set(
          error instanceof Error
            ? error.message
            : 'Failed to load user.'
        );
      }
    });
  }

  save(): void {
    if (this.form.invalid || this.saving()) {
      this.form.markAllAsTouched();
      return;
    }

    if (this.isEditing() && !this.editingUser) {
      this.formError.set(
        'The user to update is unavailable. Please reload the page.'
      );
      return;
    }

    this.saving.set(true);
    this.formError.set('');

    const data: UserFormData = this.form.getRawValue();

    const request$ = this.editingUser
      ? this.userService.updateUser(this.editingUser.id, data)
      : this.userService.createUser(data);

    request$.pipe(
      finalize(() => this.saving.set(false)),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (savedUser) => {
        const action = this.isEditing() ? 'updated' : 'created';

        void this.router.navigate(['/users'], {
          state: {
            userNotification:
              `User "${savedUser.name}" ${action} successfully.`
          }
        });
      },
      error: (error: unknown) => {
        this.formError.set(
          error instanceof Error
            ? error.message
            : 'Failed to save user.'
        );
      }
    });
  }

  cancel(): void {
    void this.router.navigate(['/users']);
  }

  hasError(
    field: keyof typeof this.form.controls,
    error: string
  ): boolean {
    const control = this.form.controls[field];
    return control.touched && control.hasError(error);
  }
}
