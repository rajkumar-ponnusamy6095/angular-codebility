import { Injectable, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID } from '@angular/core';

const TOKEN_STORAGE_KEY = 'codebility.jwt';

@Injectable({ providedIn: 'root' })
export class TokenStorage {
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  getToken(): string | null {
    return this.isBrowser ? localStorage.getItem(TOKEN_STORAGE_KEY) : null;
  }

  setToken(token: string): void {
    if (this.isBrowser) {
      localStorage.setItem(TOKEN_STORAGE_KEY, token);
    }
  }

  clear(): void {
    if (this.isBrowser) {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
    }
  }
}
