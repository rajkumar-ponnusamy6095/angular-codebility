import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Subject } from 'rxjs';

import { AuthService } from '../../core/auth/auth.service';
import { Register } from './register';

describe('Register', () => {
  let component: Register;
  let fixture: ComponentFixture<Register>;
  let auth: jasmine.SpyObj<AuthService>;

  beforeEach(async () => {
    auth = jasmine.createSpyObj<AuthService>('AuthService', ['register']);
    await TestBed.configureTestingModule({
      imports: [Register],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        { provide: AuthService, useValue: auth },
      ],
    })
    .compileComponents();

    fixture = TestBed.createComponent(Register);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('validates required fields, email, phone, password match, and terms', () => {
    component.registerForm.setValue({
      firstName: 'Ada',
      lastName: 'Lovelace',
      email: 'ada@example.com',
      gender: 'Female',
      phone: 'not-a-phone',
      department: 'Engineering',
      password: 'password123',
      confirmPassword: 'password456',
      acceptTerms: false,
    });
    expect(component.registerForm.invalid).toBeTrue();

    component.registerForm.setValue({
      firstName: 'Ada',
      lastName: 'Lovelace',
      email: 'ada@example.com',
      gender: 'Female',
      phone: '+1 555 123 4567',
      department: 'Engineering',
      password: 'password123',
      confirmPassword: 'password123',
      acceptTerms: true,
    });
    expect(component.registerForm.valid).toBeTrue();
  });

  it('accepts only the allowed department values', () => {
    component.registerForm.controls.department.setValue('Sales');
    expect(component.registerForm.controls.department.invalid).toBeTrue();

    component.registerForm.controls.department.setValue('HR');
    expect(component.registerForm.controls.department.valid).toBeTrue();
  });

  it('marks every field touched after an invalid submit', () => {
    component.onSubmit();

    expect(component.registerForm.touched).toBeTrue();
    expect(Object.values(component.controls).every((control) => control.touched)).toBeTrue();
  });

  it('clears the loading state and shows the API error after a failed registration', () => {
    const response = new Subject<void>();
    auth.register.and.returnValue(response);
    component.registerForm.setValue({
      firstName: 'Ada',
      lastName: 'Lovelace',
      email: 'ada@example.com',
      gender: 'Female',
      phone: '+1 555 123 4567',
      department: 'Engineering',
      password: 'password123',
      confirmPassword: 'password123',
      acceptTerms: true,
    });

    component.onSubmit();
    expect(component.isSubmitting()).toBeTrue();

    response.error(new Error('Email is already registered.'));
    fixture.detectChanges();

    expect(component.isSubmitting()).toBeFalse();
    expect(component.errorMessage()).toBe('Email is already registered.');
    expect(fixture.nativeElement.textContent).toContain('Email is already registered.');
    expect(fixture.nativeElement.textContent).not.toContain('Creating account...');
    expect(fixture.nativeElement.querySelector('button[type="submit"]').disabled).toBeFalse();
  });
});
