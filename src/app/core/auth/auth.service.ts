import { Injectable, inject, signal } from '@angular/core';
import { Observable, map, tap } from 'rxjs';

import {
  CurrentAccount,
  isRecord,
  parseAccountResponse
} from '../models/account';
import { ApiService } from '../services/api.service';
import { TokenStorage } from './token-storage.service';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthenticationResponse {
  email: string;
  jwtToken: string;
}

export interface RegistrationData {
  firstName: string;
  lastName: string;
  email: string;
  gender: string;
  phone: string;
  department: string;
  password: string;
  confirmPassword: string;
  acceptTerms: boolean;
}

export interface PasswordChangeData {
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly api = inject(ApiService);
  private readonly tokenStorage = inject(TokenStorage);

  readonly account = signal<CurrentAccount | null>(null);

  get isAuthenticated(): boolean {
    return Boolean(this.tokenStorage.getToken());
  }

  login(credentials: LoginCredentials): Observable<AuthenticationResponse> {
    return this.api.post('/v1/accounts/authenticate', credentials, false).pipe(
      map(value => {
        if (
          !isRecord(value) ||
          typeof value['email'] !== 'string' ||
          typeof value['jwtToken'] !== 'string' ||
          value['jwtToken'].length === 0
        ) {
          throw new Error('The API returned an invalid authentication response.');
        }

        return {
          email: value['email'],
          jwtToken: value['jwtToken']
        };
      }),
      tap(response => this.tokenStorage.setToken(response.jwtToken))
    );
  }

  register(data: RegistrationData): Observable<void> {
    const request = { ...data, gender: data.gender.toLowerCase() };
    return this.api.post('/v1/accounts/register', request, false).pipe(
      map(() => undefined)
    );
  }

  getMe(): Observable<CurrentAccount> {
    return this.api.get('/v1/accounts/me').pipe(
      map((value): CurrentAccount => {
        const account = parseAccountResponse(value);
        const role: CurrentAccount['role'] =
          account.role === 'Admin' ? 'ADMIN' : 'USER';
        return {
          ...account,
          role
        };
      }),
      tap(account => this.account.set(account))
    );
  }

  forgotPassword(email: string): Observable<string> {
    return this.messageRequest('/v1/accounts/forgot-password', { email });
  }

  validateResetToken(token: string): Observable<string> {
    return this.api.post('/v1/accounts/validate-reset-token', { token }, false).pipe(
      map(value => {
        if (isRecord(value) && typeof value['message'] === 'string') {
          return value['message'];
        }
        if (isRecord(value) && typeof value['token'] === 'string' && value['token'].length > 0) {
          return 'The password reset link is valid.';
        }
        throw new Error('The API returned an invalid password reset validation response.');
      })
    );
  }

  resetPassword(
    token: string,
    password: string,
    confirmPassword: string
  ): Observable<string> {
    return this.messageRequest('/v1/accounts/reset-password', {
      token,
      password,
      confirmPassword
    });
  }

  changePassword(data: PasswordChangeData): Observable<void> {
    return this.api.post('/v1/accounts/change-password', data).pipe(
      map(() => undefined)
    );
  }

  verifyEmail(token: string): Observable<string> {
    return this.api.post('/v1/accounts/verify-email', { token }, false).pipe(
      map(value => {
        if (isRecord(value) && typeof value['message'] === 'string') {
          return value['message'];
        }
        if (isRecord(value) && typeof value['token'] === 'string' && value['token'].length > 0) {
          return 'Your email address has been verified successfully.';
        }
        throw new Error('The API returned an invalid email verification response.');
      })
    );
  }

  logout(): void {
    this.tokenStorage.clear();
    this.account.set(null);
  }

  private messageRequest(
    path: string,
    body: Record<string, string>
  ): Observable<string> {
    return this.api.post(path, body, false).pipe(
      map(value => {
        if (!isRecord(value) || typeof value['message'] !== 'string') {
          throw new Error('The API returned an invalid message response.');
        }
        return value['message'];
      })
    );
  }
}