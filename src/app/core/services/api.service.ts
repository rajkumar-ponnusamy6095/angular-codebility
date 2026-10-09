import {
  HttpClient,
  HttpContext,
  HttpContextToken,
  HttpErrorResponse,
  HttpHeaders
} from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, throwError } from 'rxjs';

import { environment } from '../../../environments/environment';

export const SKIP_AUTH = new HttpContextToken<boolean>(() => false);

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiBaseUrl.replace(/\/+$/, '');

  get(path: string, authenticated = true): Observable<unknown> {
    return this.send('GET', path, undefined, authenticated);
  }

  post(path: string, body: unknown, authenticated = true): Observable<unknown> {
    return this.send('POST', path, body, authenticated);
  }

  put(path: string, body: unknown, authenticated = true): Observable<unknown> {
    return this.send('PUT', path, body, authenticated);
  }

  delete(path: string, authenticated = true): Observable<unknown> {
    return this.send('DELETE', path, undefined, authenticated);
  }

  private send(
    method: string,
    path: string,
    body: unknown,
    authenticated: boolean
  ): Observable<unknown> {
    const headers = body === undefined
      ? undefined
      : new HttpHeaders({ 'Content-Type': 'application/json' });
    const context = new HttpContext().set(SKIP_AUTH, !authenticated);

    return this.http.request(method, `${this.baseUrl}${path}`, {
      body,
      context,
      headers,
      responseType: 'text'
    }).pipe(
      map(response => this.parseSuccess(response)),
      catchError((error: unknown) => throwError(() => this.toApiError(error)))
    );
  }

  private parseSuccess(response: string): unknown {
    if (response.length === 0) {
      return undefined;
    }

    try {
      return JSON.parse(response) as unknown;
    } catch {
      throw new ApiError(200, 'The API returned an invalid JSON response.');
    }
  }

  private toApiError(error: unknown): Error {
    if (error instanceof ApiError) {
      return error;
    }

    if (error instanceof HttpErrorResponse) {
      const body = typeof error.error === 'string'
        ? error.error
        : error.error == null
          ? ''
          : JSON.stringify(error.error);
      let message = '';
      let hasMessage = false;

      if (body) {
        try {
          const parsed: unknown = JSON.parse(body);
          if (
            typeof parsed === 'object' &&
            parsed !== null &&
            'message' in parsed &&
            typeof parsed.message === 'string'
          ) {
            message = parsed.message;
            hasMessage = true;
          }
        } catch {
          message = body;
        }

        if (!hasMessage && !message) {
          message = body;
        }
      }

      return new ApiError(
        error.status,
        hasMessage
          ? message
          : message || error.statusText || 'Request failed'
      );
    }

    return error instanceof Error
      ? error
      : new Error('Request failed');
  }
}