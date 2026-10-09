import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  provideHttpClient,
  withInterceptors
} from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting
} from '@angular/common/http/testing';

import { TokenStorage } from './token-storage.service';
import { AuthService } from './auth.service';
import { authInterceptor } from './auth.interceptor';

describe('AuthService', () => {
  let auth: AuthService;
  let http: HttpTestingController;
  let tokenStorage: TokenStorage;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting()
      ]
    });
    auth = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
    tokenStorage = TestBed.inject(TokenStorage);
  });

  afterEach(() => {
    tokenStorage.clear();
    http.verify();
  });

  it('authenticates without an old token and stores a valid returned token', () => {
    tokenStorage.setToken('old-token');
    auth.login({ email: 'jane@example.com', password: 'secret' }).subscribe();

    const request = http.expectOne(
      'http://localhost:4000/api/v1/accounts/authenticate'
    );
    expect(request.request.headers.has('Authorization')).toBeFalse();
    expect(request.request.body).toEqual({
      email: 'jane@example.com',
      password: 'secret'
    });
    request.flush({ email: 'jane@example.com', jwtToken: 'new-token' });
    expect(tokenStorage.getToken()).toBe('new-token');
  });

  it('registers without authentication and accepts an empty success body', () => {
    tokenStorage.setToken('jwt-value');
    auth.register({
      firstName: 'Jane',
      lastName: 'Doe',
      email: 'jane@example.com',
      gender: 'Female',
      phone: '+1234567890',
      department: 'Engineering',
      password: 'secret',
      confirmPassword: 'secret',
      acceptTerms: true
    }).subscribe();

    const request = http.expectOne('http://localhost:4000/api/v1/accounts/register');
    expect(request.request.headers.has('Authorization')).toBeFalse();
    expect(request.request.body.gender).toBe('female');
    expect(request.request.body.acceptTerms).toBeTrue();
    request.flush('');
  });

  it('loads the current account with a bearer token and normalizes its role', () => {
    tokenStorage.setToken('jwt-value');
    let role = '';
    auth.getMe().subscribe(account => role = account.role);

    const request = http.expectOne('http://localhost:4000/api/v1/accounts/me');
    expect(request.request.headers.get('Authorization')).toBe('Bearer jwt-value');
    request.flush({ data: currentAccountData() });
    expect(role).toBe('ADMIN');
  });

  it('calls recovery endpoints without authentication and reads each message', () => {
    const responses: string[] = [];
    auth.forgotPassword('jane@example.com').subscribe(value => responses.push(value));
    expectPublicMessageRequest(
      http,
      '/v1/accounts/forgot-password',
      { email: 'jane@example.com' }
    );

    auth.validateResetToken('reset-token').subscribe(value => responses.push(value));
    expectPublicMessageRequest(
      http,
      '/v1/accounts/validate-reset-token',
      { token: 'reset-token' }
    );

    auth.resetPassword('reset-token', 'new-secret', 'new-secret')
      .subscribe(value => responses.push(value));
    expectPublicMessageRequest(
      http,
      '/v1/accounts/reset-password',
      {
        token: 'reset-token',
        password: 'new-secret',
        confirmPassword: 'new-secret'
      }
    );

    expect(responses).toEqual([
      'ok',
      'ok',
      'ok'
    ]);
  });

  it('accepts the token response from email verification without exposing it as a message', () => {
    let response = '';
    auth.verifyEmail('verify-token').subscribe(value => response = value);

    const request = http.expectOne('http://localhost:4000/api/v1/accounts/verify-email');
    expect(request.request.headers.has('Authorization')).toBeFalse();
    expect(request.request.body).toEqual({ token: 'verify-token' });
    request.flush({ token: 'verification-result-token' });

    expect(response).toBe('Your email address has been verified successfully.');
  });

  it('accepts a token response when validating a password reset link', () => {
    let response = '';
    auth.validateResetToken('reset-token').subscribe(value => response = value);

    const request = http.expectOne(
      'http://localhost:4000/api/v1/accounts/validate-reset-token'
    );
    expect(request.request.headers.has('Authorization')).toBeFalse();
    expect(request.request.body).toEqual({ token: 'reset-token' });
    request.flush({ token: 'validated-reset-token' });

    expect(response).toBe('The password reset link is valid.');
  });

  it('changes password with authentication and accepts an empty success body', () => {
    tokenStorage.setToken('jwt-value');
    auth.changePassword({
      oldPassword: 'old-secret',
      newPassword: 'new-secret',
      confirmPassword: 'new-secret'
    }).subscribe();

    const request = http.expectOne(
      'http://localhost:4000/api/v1/accounts/change-password'
    );
    expect(request.request.headers.get('Authorization')).toBe('Bearer jwt-value');
    request.flush('');
  });
});

function expectPublicMessageRequest(
  http: HttpTestingController,
  path: string,
  body: Record<string, string>
): void {
  const request = http.expectOne(`http://localhost:4000/api${path}`);
  expect(request.request.headers.has('Authorization')).toBeFalse();
  expect(request.request.body).toEqual(body);
  request.flush({ message: 'ok' });
}

function currentAccountData(): Record<string, unknown> {
  return {
    id: 'account-id',
    email: 'jane@example.com',
    firstName: 'Jane',
    lastName: 'Doe',
    gender: 'female',
    phone: '+1234567890',
    department: 'Engineering',
    status: 'active',
    role: 'admin',
    createdAt: '2024-06-01T00:00:00Z',
    isVerified: true
  };
}
