import { CommonModule } from '@angular/common';
import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { forkJoin, finalize } from 'rxjs';

import { UserService } from '../users/user.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard implements OnInit {
  private readonly userService = inject(UserService);
  private readonly destroyRef = inject(DestroyRef);

  readonly loading = signal(true);
  readonly error = signal('');
  readonly overview = signal<{ total: number; active: number; admins: number } | null>(null);

  ngOnInit(): void {
    this.loadOverview();
  }

  loadOverview(): void {
    this.loading.set(true);
    this.error.set('');

    forkJoin({
      allUsers: this.userService.getUsers({ page: 1, limit: 1 }),
      activeUsers: this.userService.getUsers({ page: 1, limit: 1, status: 'active' }),
      adminUsers: this.userService.getUsers({ page: 1, limit: 1, role: 'admin' }),
    }).pipe(
      finalize(() => this.loading.set(false)),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: ({ allUsers, activeUsers, adminUsers }) => {
        this.overview.set({
          total: allUsers.pagination.total,
          active: activeUsers.pagination.total,
          admins: adminUsers.pagination.total,
        });
      },
      error: (error: unknown) => {
        this.overview.set(null);
        this.error.set(
          error instanceof Error ? error.message : 'Failed to load the dashboard overview.'
        );
      },
    });
  }
}
