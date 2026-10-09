
import { Injectable, signal } from '@angular/core';

export type AppTheme =
  | 'blue'
  | 'orange'
  | 'pink'
  | 'green'
  | 'yellow';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private readonly storageKey = 'codebility-theme';

  readonly themes: AppTheme[] = [
    'blue',
    'orange',
    'pink',
    'green',
    'yellow',
  ];

  readonly currentTheme = signal<AppTheme>(
    this.getInitialTheme()
  );

  constructor() {
    this.applyTheme(this.currentTheme());
  }

  setTheme(theme: AppTheme): void {
    if (!this.themes.includes(theme)) {
      return;
    }

    this.currentTheme.set(theme);
    this.applyTheme(theme);

    localStorage.setItem(this.storageKey, theme);
  }

  private applyTheme(theme: AppTheme): void {
    document.documentElement.setAttribute('data-theme', theme);
  }

  private getInitialTheme(): AppTheme {
    const savedTheme = localStorage.getItem(this.storageKey);

    if (
      savedTheme &&
      this.themes.includes(savedTheme as AppTheme)
    ) {
      return savedTheme as AppTheme;
    }

    return 'blue';
  }
}
