import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Subject } from 'rxjs';

import { AuthService } from '../../core/auth/auth.service';
import { ForgotPassword } from './forgot-password';

describe('ForgotPassword', () => {
  let component: ForgotPassword;
  let fixture: ComponentFixture<ForgotPassword>;
  let auth: jasmine.SpyObj<AuthService>;

  beforeEach(async () => {
    auth = jasmine.createSpyObj<AuthService>('AuthService', ['forgotPassword']);

    await TestBed.configureTestingModule({
      imports: [ForgotPassword],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        { provide: AuthService, useValue: auth }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ForgotPassword);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('accepts only a valid email address', () => {
    component.email.setValue('invalid-email');
    expect(component.forgotPasswordForm.invalid).toBeTrue();

    component.email.setValue('user@example.com');
    expect(component.forgotPasswordForm.valid).toBeTrue();
  });

  it('shows the success state and clears the sending state after a successful response', () => {
    const response = new Subject<string>();
    auth.forgotPassword.and.returnValue(response);
    component.email.setValue('user@example.com');

    component.onSubmit();
    expect(component.isSubmitting()).toBeTrue();

    response.next('Password reset instructions sent.');
    response.complete();
    fixture.detectChanges();

    expect(component.isSubmitting()).toBeFalse();
    expect(component.successMessage()).toBe('Password reset instructions sent.');
    expect(fixture.nativeElement.textContent).toContain('Password reset instructions sent.');
    expect(fixture.nativeElement.textContent).not.toContain('Sending...');
  });

  it('clears the sending state and displays the API error after a failed request', () => {
    const response = new Subject<string>();
    auth.forgotPassword.and.returnValue(response);
    component.email.setValue('user@example.com');

    component.onSubmit();
    expect(component.isSubmitting()).toBeTrue();

    response.error(new Error('Unable to send reset instructions.'));
    fixture.detectChanges();

    expect(component.isSubmitting()).toBeFalse();
    expect(component.errorMessage()).toBe('Unable to send reset instructions.');
    expect(fixture.nativeElement.textContent).toContain('Unable to send reset instructions.');
    expect(fixture.nativeElement.textContent).not.toContain('Sending...');
    expect(fixture.nativeElement.querySelector('button[type="submit"]').disabled).toBeFalse();
  });
});
