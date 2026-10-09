import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { Subject } from 'rxjs';

import { AuthService } from '../../core/auth/auth.service';
import { Login } from './login';

describe('Login', () => {
  let component: Login;
  let fixture: ComponentFixture<Login>;
  let auth: jasmine.SpyObj<AuthService>;

  beforeEach(async () => {
    auth = jasmine.createSpyObj<AuthService>('AuthService', ['login']);
    await TestBed.configureTestingModule({
      imports: [Login],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { queryParamMap: { get: () => null } } },
        },
        { provide: AuthService, useValue: auth },
      ],
    })
    .compileComponents();

    fixture = TestBed.createComponent(Login);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('requires a valid email and password', () => {
    expect(component.loginForm.invalid).toBeTrue();

    component.loginForm.setValue({
      email: 'invalid-email',
      password: 'password',
    });
    expect(component.loginForm.invalid).toBeTrue();

    component.loginForm.setValue({
      email: 'user@example.com',
      password: 'password',
    });
    expect(component.loginForm.valid).toBeTrue();
  });

  it('shows validation state after an invalid submit', () => {
    component.onSubmit();

    expect(component.email.touched).toBeTrue();
    expect(component.password.touched).toBeTrue();
  });

  it('clears the loading state and shows the API error after a failed login', () => {
    const response = new Subject<{ email: string; jwtToken: string }>();
    auth.login.and.returnValue(response);
    component.loginForm.setValue({
      email: 'user@example.com',
      password: 'password',
    });

    component.onSubmit();
    expect(component.isSubmitting()).toBeTrue();

    response.error(new Error('Invalid credentials.'));
    fixture.detectChanges();

    expect(component.isSubmitting()).toBeFalse();
    expect(component.errorMessage()).toBe('Invalid credentials.');
    expect(fixture.nativeElement.textContent).toContain('Invalid credentials.');
    expect(fixture.nativeElement.textContent).not.toContain('Signing in...');
    expect(fixture.nativeElement.querySelector('button').disabled).toBeFalse();
  });
});
