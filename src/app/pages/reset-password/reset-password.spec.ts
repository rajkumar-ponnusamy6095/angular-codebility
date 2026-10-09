import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { Subject, of } from 'rxjs';

import { AuthService } from '../../core/auth/auth.service';
import { ResetPassword } from './reset-password';

describe('ResetPassword', () => {
  let component: ResetPassword;
  let fixture: ComponentFixture<ResetPassword>;
  let queryToken: string;
  let auth: jasmine.SpyObj<AuthService>;

  beforeEach(async () => {
    queryToken = 'valid-token';
    auth = jasmine.createSpyObj<AuthService>(
      'AuthService',
      ['validateResetToken', 'resetPassword']
    );
    auth.validateResetToken.and.returnValue(of('The password reset link is valid.'));

    await TestBed.configureTestingModule({
      imports: [ResetPassword],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { queryParamMap: { get: () => queryToken } } },
        },
        { provide: AuthService, useValue: auth },
      ],
    }).compileComponents();
  });

  it('should create', () => {
    createFixture();
    expect(component).toBeTruthy();
  });

  it('requires a valid password and matching confirmation', () => {
    createFixture();

    component.resetPasswordForm.setValue({
      password: 'short',
      confirmPassword: 'short',
    });
    expect(component.resetPasswordForm.invalid).toBeTrue();

    component.resetPasswordForm.setValue({
      password: 'password123',
      confirmPassword: 'different123',
    });
    expect(component.resetPasswordForm.invalid).toBeTrue();

    component.resetPasswordForm.setValue({
      password: 'password123',
      confirmPassword: 'password123',
    });
    expect(component.resetPasswordForm.valid).toBeTrue();
  });

  it('shows the reset form once token validation succeeds', () => {
    createFixture();

    expect(auth.validateResetToken).toHaveBeenCalledWith('valid-token');
    expect(component.tokenStatus()).toBe('ready');
    expect(fixture.nativeElement.querySelector('form')).not.toBeNull();
    expect(fixture.nativeElement.textContent).not.toContain(
      'Checking your password reset link...'
    );
  });

  it('returns to the validating state when the validation request is pending', () => {
    const response = new Subject<string>();
    auth.validateResetToken.and.returnValue(response);
    createFixture();

    expect(component.tokenStatus()).toBe('validating');
    expect(fixture.nativeElement.querySelector('form')).toBeNull();

    response.next('The password reset link is valid.');
    response.complete();
    fixture.detectChanges();

    expect(component.tokenStatus()).toBe('ready');
    expect(fixture.nativeElement.querySelector('form')).not.toBeNull();
  });

  it('shows the validation error when the reset token is rejected', () => {
    const response = new Subject<string>();
    auth.validateResetToken.and.returnValue(response);
    createFixture();

    expect(component.tokenStatus()).toBe('validating');
    response.error(new Error('This link has expired.'));
    fixture.detectChanges();

    expect(component.tokenStatus()).toBe('invalid');
    expect(component.errorMessage()).toBe('This link has expired.');
    expect(fixture.nativeElement.textContent).toContain('This link has expired.');
  });

  it('clears the submitting state and displays the API error after a failed reset', () => {
    const response = new Subject<string>();
    auth.resetPassword.and.returnValue(response);
    createFixture();
    component.resetPasswordForm.setValue({
      password: 'password123',
      confirmPassword: 'password123',
    });

    component.onSubmit();
    expect(component.isSubmitting()).toBeTrue();

    response.error(new Error('Unable to reset the password.'));
    fixture.detectChanges();

    expect(component.isSubmitting()).toBeFalse();
    expect(component.errorMessage()).toBe('Unable to reset the password.');
    expect(fixture.nativeElement.textContent).toContain('Unable to reset the password.');
    expect(fixture.nativeElement.textContent).not.toContain('Resetting...');
    expect(fixture.nativeElement.querySelector('button[type="submit"]').disabled).toBeFalse();
  });

  function createFixture(): void {
    fixture = TestBed.createComponent(ResetPassword);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }
});
