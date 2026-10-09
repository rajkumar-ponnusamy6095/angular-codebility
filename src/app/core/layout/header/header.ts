
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  Component,
  inject,
  input,
  output,
  signal
} from '@angular/core';
import { RouterLink } from '@angular/router';

import { ThemeService } from '../../theme.service';

type AppTheme = 'blue' | 'orange' | 'pink' | 'green' | 'yellow' | 'violet';

export interface HeaderUser {
  name: string;
  email: string;
}

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './header.html',
  styleUrl: './header.css'
})
export class Header {
  readonly themeService = inject(ThemeService);

  readonly sidebarOpen = input(false);
  readonly user = input<HeaderUser | null>(null);
  readonly logoutError = input('');
  readonly accountError = input('');

  readonly menuToggle = output<void>();
  readonly logoutRequested = output<void>();

  readonly mobileNavOpen = signal(false);
  readonly profileMenuOpen = signal(false);

  get userInitial(): string {
    return this.user()?.name.trim().charAt(0).toUpperCase() || 'P';
  }

  readonly themeLabels: Record<AppTheme, string> = {
    blue: 'Blue',
    orange: 'Orange',
    pink: 'Pink',
    green: 'Green',
    yellow: 'Yellow',
    violet: 'Violet'
  };

  get currentTheme(): AppTheme {
    return this.themeService.currentTheme();
  }

  setTheme(value: string): void {
    if (
      value === 'blue' ||
      value === 'orange' ||
      value === 'pink' ||
      value === 'green' ||
      value === 'yellow'
      || value === 'violet'
    ) {
      this.themeService.setTheme(value);
    }
  }

  toggleMobileNav(): void {
    this.mobileNavOpen.update(open => !open);
  }

  closeMobileNav(): void {
    this.mobileNavOpen.set(false);
    this.profileMenuOpen.set(false);
  }

  toggleProfileMenu(): void {
    this.profileMenuOpen.update(open => !open);
  }

  closeProfileMenu(): void {
    this.profileMenuOpen.set(false);
  }

  onMenuToggle(): void {
    this.menuToggle.emit();
    this.closeMobileNav();
  }

  onLogout(): void {
    this.logoutRequested.emit();
    this.closeMobileNav();
  }

  onEscape(): void {
    this.closeProfileMenu();
  }
}
