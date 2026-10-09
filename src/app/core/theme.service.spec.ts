import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { ThemeService } from './theme.service';

describe('ThemeService', () => {
  const storageKey = 'codebility-theme';

  beforeEach(() => {
    localStorage.removeItem(storageKey);
    document.documentElement.setAttribute('data-theme', 'blue');
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()]
    });
  });

  afterEach(() => {
    localStorage.removeItem(storageKey);
    document.documentElement.setAttribute('data-theme', 'blue');
  });

  it('restores the saved theme and applies it to the document', () => {
    localStorage.setItem(storageKey, 'green');

    const service = TestBed.inject(ThemeService);

    expect(service.currentTheme()).toBe('green');
    expect(document.documentElement.getAttribute('data-theme')).toBe('green');
  });

  it('falls back to blue when the saved theme is invalid', () => {
    localStorage.setItem(storageKey, 'invalid');

    const service = TestBed.inject(ThemeService);

    expect(service.currentTheme()).toBe('blue');
    expect(document.documentElement.getAttribute('data-theme')).toBe('blue');
  });
});
