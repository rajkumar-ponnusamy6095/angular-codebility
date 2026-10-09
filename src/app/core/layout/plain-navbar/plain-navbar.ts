
import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AppTheme, ThemeService } from '../../theme.service';

@Component({
  selector: 'app-plain-navbar',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './plain-navbar.html',
  styleUrl: './plain-navbar.css',
})
export class PlainNavbar {
  protected readonly themeService = inject(ThemeService);

  readonly themeLabels: Record<AppTheme, string> = {
    blue: 'Blue',
    orange: 'Orange',
    pink: 'Pink',
    green: 'Green',
    yellow: 'Yellow',
    violet: 'Violet',
  };

  onThemeChange(theme: AppTheme): void {
    this.themeService.setTheme(theme);
  }
}
