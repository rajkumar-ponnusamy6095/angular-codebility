
import { CommonModule } from '@angular/common';
import {
  Component,
  DestroyRef,
  HostListener,
  OnInit,
  computed,
  inject,
  signal
} from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { AuthService } from '../../auth/auth.service';
import { Header, HeaderUser } from '../header/header';
import { Sidebar } from '../sidebar/sidebar';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    Header,
    Sidebar
  ],
  templateUrl: './app-layout.html',
  styleUrl: './app-layout.css'
})
export class AppLayout implements OnInit {
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);

  readonly sidebarOpen = signal(true);
  readonly mobileView = signal(false);
  readonly currentUser = computed<HeaderUser | null>(() => {
    const account = this.auth.account();
    return account
      ? { name: account.name, email: account.email }
      : null;
  });
  readonly logoutError = signal('');
  readonly accountError = signal('');

  constructor() {
    this.updateViewport();
  }

  ngOnInit(): void {
    if (!this.auth.isAuthenticated) {
      return;
    }

    this.auth.getMe().pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      error: (error: unknown) => {
        this.accountError.set(error instanceof Error
          ? error.message
          : 'Failed to load your account.');
      }
    });
  }

  @HostListener('window:resize')
  updateViewport(): void {
    const isMobile = window.innerWidth < 768;

    this.mobileView.set(isMobile);

    if (isMobile) {
      this.sidebarOpen.set(false);
    } else {
      this.sidebarOpen.set(true);
    }
  }

  toggleSidebar(): void {
    this.sidebarOpen.update(open => !open);
  }

  onSidebarNavigationSelected(): void {
    if (this.mobileView()) {
      this.sidebarOpen.set(false);
    }
  }

  closeSidebar(): void {
    if (this.mobileView()) {
      this.sidebarOpen.set(false);
    }
  }

  handleLogout(): void {
    this.logoutError.set('');
    this.auth.logout();

    void this.router.navigate(['/login']).then(navigated => {
      if (!navigated) {
        this.logoutError.set('You have been signed out, but could not be redirected to login.');
      }
    }).catch((error: unknown) => {
      this.logoutError.set(error instanceof Error
        ? error.message
        : 'You have been signed out, but could not be redirected to login.');
    });
  }
}
