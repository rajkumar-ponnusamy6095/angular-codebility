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

import { authInterceptor } from '../../core/auth/auth.interceptor';
import { TokenStorage } from '../../core/auth/token-storage.service';
import { UserService } from './user.service';

describe('UserService', () => {
  let service: UserService;
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
    service = TestBed.inject(UserService);
    http = TestBed.inject(HttpTestingController);
    tokenStorage = TestBed.inject(TokenStorage);
    tokenStorage.setToken('jwt-value');
  });

  afterEach(() => {
    tokenStorage.clear();
    http.verify();
  });

  it('encodes list filters and validates/normalizes account data', () => {
    let result: unknown;
    service.getUsers({
      page: 2,
      limit: 25,
      search: 'Jane Doe',
      sortBy: 'name',
      sortOrder: 'asc',
      role: 'admin',
      status: 'active',
      department: 'Engineering'
    }).subscribe(value => result = value);

    const request = http.expectOne(
      'http://localhost:4000/api/v1/accounts?page=2&limit=25&search=Jane%20Doe&sortBy=firstName&sortOrder=asc&role=Admin&status=active&department=Engineering'
    );
    expect(request.request.headers.get('Authorization')).toBe('Bearer jwt-value');
    request.flush({
      data: [accountData()],
      pagination: { page: 2, limit: 25, total: 1, totalPages: 1 }
    });

    expect(result).toEqual(jasmine.objectContaining({
      data: [jasmine.objectContaining({
        name: 'Jane Doe',
        role: 'admin',
        gender: 'female',
        isVerified: true
      })],
      pagination: { page: 2, limit: 25, total: 1, totalPages: 1 }
    }));
  });

  it('encodes account IDs and sends API role values in title case', () => {
    service.createUser({
      firstName: 'Jane',
      lastName: 'Doe',
      email: 'jane@example.com',
      gender: 'female',
      phone: '+1234567890',
      department: 'Engineering',
      role: 'admin',
      status: 'active'
    }).subscribe();

    const createRequest = http.expectOne('http://localhost:4000/api/v1/accounts');
    expect(createRequest.request.body.role).toBe('Admin');
    createRequest.flush(accountData());

    service.getUser('account/id').subscribe();
    const getRequest = http.expectOne(
      'http://localhost:4000/api/v1/accounts/account%2Fid'
    );
    getRequest.flush(accountData());
  });
});

function accountData(): Record<string, unknown> {
  return {
    id: 'account-id',
    firstName: 'Jane',
    lastName: 'Doe',
    gender: 'Female',
    email: 'jane@example.com',
    phone: '+1234567890',
    department: 'Engineering',
    role: 'Admin',
    status: 'active',
    createdAt: '2024-06-01T00:00:00Z',
    isVerified: true
  };
}
