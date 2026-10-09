import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  provideHttpClient,
  withInterceptors
} from '@angular/common/http';
import { provideRouter, Router } from '@angular/router';
import {
  HttpTestingController,
  provideHttpClientTesting
} from '@angular/common/http/testing';

import { authInterceptor } from '../auth/auth.interceptor';
import { AuthService } from '../auth/auth.service';
import { TokenStorage } from '../auth/token-storage.service';
import { ApiError, ApiService } from './api.service';

describe('ApiService', () => {
  let api: ApiService;
  let http: HttpTestingController;
  let tokenStorage: TokenStorage;
  let auth: AuthService;
  let router: Router;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        provideRouter([])
      ]
    });
    api = TestBed.inject(ApiService);
    http = TestBed.inject(HttpTestingController);
    tokenStorage = TestBed.inject(TokenStorage);
    auth = TestBed.inject(AuthService);
    router = TestBed.inject(Router);
  });

  afterEach(() => {
    tokenStorage.clear();
    http.verify();
  });

  it('sends JSON and a stored bearer token by default', () => {
    tokenStorage.setToken('jwt-value');
    api.post('/v1/accounts', { firstName: 'Jane' }).subscribe();

    const request = http.expectOne('http://localhost:4000/api/v1/accounts');
    expect(request.request.headers.get('Content-Type')).toBe('application/json');
    expect(request.request.headers.get('Authorization')).toBe('Bearer jwt-value');
    expect(request.request.body).toEqual({ firstName: 'Jane' });
    request.flush('{}');
  });

  it('omits bearer credentials when authentication is disabled', () => {
    tokenStorage.setToken('jwt-value');
    api.post('/v1/accounts/authenticate', { email: 'jane@example.com' }, false).subscribe();

    const request = http.expectOne(
      'http://localhost:4000/api/v1/accounts/authenticate'
    );
    expect(request.request.headers.has('Authorization')).toBeFalse();
    request.flush('{"email":"jane@example.com","jwtToken":"new-token"}');
  });

  it('resolves an empty successful response without a value', () => {
    let result: unknown = 'pending';
    api.delete('/v1/accounts/id').subscribe(value => result = value);

    http.expectOne('http://localhost:4000/api/v1/accounts/id').flush('');
    expect(result).toBeUndefined();
  });

  it('uses a string message in an HTTP error and preserves its status', () => {
    let receivedError: unknown;
    api.get('/v1/accounts').subscribe({ error: error => receivedError = error });

    http.expectOne('http://localhost:4000/api/v1/accounts').flush(
      '{"message":"Access denied"}',
      { status: 403, statusText: 'Forbidden' }
    );

    expect(receivedError).toEqual(jasmine.any(ApiError));
    expect(receivedError).toEqual(jasmine.objectContaining({
      status: 403,
      message: 'Access denied'
    }));
  });

  it('clears the session and navigates to login when an authenticated request returns 401', () => {
    const navigate = spyOn(router, 'navigate').and.resolveTo(true);
    tokenStorage.setToken('expired-token');
    auth.account.set({
      id: 'account-id',
      email: 'jane@example.com',
      firstName: 'Jane',
      lastName: 'Doe',
      name: 'Jane Doe',
      gender: 'female',
      phone: '+1234567890',
      department: 'Engineering',
      status: 'active',
      role: 'ADMIN',
      createdAt: '2024-06-01T00:00:00Z',
      isVerified: true
    });

    api.get('/v1/accounts/me').subscribe({ error: () => undefined });
    http.expectOne('http://localhost:4000/api/v1/accounts/me').flush(
      '',
      { status: 401, statusText: 'Unauthorized' }
    );

    expect(tokenStorage.getToken()).toBeNull();
    expect(auth.account()).toBeNull();
    expect(navigate).toHaveBeenCalledWith(['/login']);
  });

  it('does not clear the session for a 401 from a request that skips authentication', () => {
    const navigate = spyOn(router, 'navigate').and.resolveTo(true);
    tokenStorage.setToken('existing-token');

    api.post('/v1/accounts/authenticate', {}, false)
      .subscribe({ error: () => undefined });
    http.expectOne('http://localhost:4000/api/v1/accounts/authenticate').flush(
      '',
      { status: 401, statusText: 'Unauthorized' }
    );

    expect(tokenStorage.getToken()).toBe('existing-token');
    expect(navigate).not.toHaveBeenCalled();
  });
});
