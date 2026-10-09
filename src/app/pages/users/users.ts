import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  Subject,
  catchError,
  debounceTime,
  distinctUntilChanged,
  finalize,
  of,
  switchMap,
  tap,
} from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { UserService } from './user.service';
import { User, UserRole, UserStatus, UserListResponse } from './user.model';
import { DEPARTMENTS } from '../../core/models/department';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe],
  templateUrl: './users.html',
  styleUrl: './users.css',
})
export class Users implements OnInit {
  private readonly userService = inject(UserService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly users = signal<User[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly notification = signal('');

  readonly pagination = signal({
    page: 1,
    limit: 5,
    total: 0,
    totalPages: 1,
  });

  readonly pageSizeOptions = [5, 10, 25, 100];

  search = '';
  role: UserRole | '' = '';
  status: UserStatus | '' = '';
  department = '';

  sortField: keyof User = 'id';
  sortDirection: 'asc' | 'desc' = 'asc';

  readonly departments = DEPARTMENTS;

  private readonly searchChanges = new Subject<string>();
  private readonly refreshChanges = new Subject<void>();

  readonly userToDelete = signal<User | null>(null);
  readonly deleting = signal(false);

  ngOnInit(): void {
    this.searchChanges
      .pipe(
        debounceTime(900),
        distinctUntilChanged(),
        tap(() => this.pagination.update((p) => ({ ...p, page: 1 }))),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => this.loadUsers());

    this.refreshChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.loadUsers());

    this.loadUsers();
  }

  onSearchChange(value: string): void {
    this.search = value;
    this.searchChanges.next(value);
  }

  loadUsers(): void {
    this.loading.set(true);
    this.error.set('');

    const page = this.pagination().page;
    const limit = this.pagination().limit;

    this.userService
      .getUsers({
        page,
        limit,
        search: this.search.trim() || undefined,
        sortBy: this.sortField,
        sortOrder: this.sortDirection,
        role: this.role || undefined,
        status: this.status || undefined,
        department: this.department || undefined,
      })
      .pipe(
        catchError((error: unknown) => {
          this.error.set(error instanceof Error ? error.message : 'Failed to load users.');
          return of(null);
        }),
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((response: UserListResponse | null) => {
        if (!response) {
          this.users.set([]);
          return;
        }

        this.users.set(response.data);
        this.pagination.set(response.pagination);
      });
  }

  applyFilters(): void {
    this.pagination.update((p) => ({ ...p, page: 1 }));
    this.loadUsers();
  }

  sortBy(field: keyof User): void {
    if (this.sortField === field) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortField = field;
      this.sortDirection = 'asc';
    }

    this.applyFilters();
  }

  sortIcon(field: keyof User): string {
    if (this.sortField !== field) {
      return 'bi-arrow-down-up';
    }

    return this.sortDirection === 'asc' ? 'bi-arrow-up' : 'bi-arrow-down';
  }

  changePage(page: number): void {
    const totalPages = Math.max(1, this.pagination().totalPages);

    if (page < 1 || page > totalPages) {
      return;
    }

    this.pagination.update((p) => ({ ...p, page }));
    this.loadUsers();
  }

  changePageSize(value: number): void {
    this.pagination.update((p) => ({
      ...p,
      page: 1,
      limit: value,
    }));

    this.loadUsers();
  }

  get firstVisibleUser(): number {
    const { page, limit, total } = this.pagination();
    return total === 0 ? 0 : (page - 1) * limit + 1;
  }

  get lastVisibleUser(): number {
    const { page, limit, total } = this.pagination();
    return Math.min(page * limit, total);
  }

  get visiblePages(): number[] {
    const current = this.pagination().page;
    const total = Math.max(1, this.pagination().totalPages);

    return [...new Set([1, current - 1, current, current + 1, total])]
      .filter((page) => page >= 1 && page <= total)
      .sort((a, b) => a - b);
  }

  addUser(): void {
    void this.router.navigate(['/users/create']);
  }

  editUser(user: User): void {
    void this.router.navigate(['/users', user.id, 'edit']);
  }

  confirmDelete(user: User): void {
    this.userToDelete.set(user);
  }

  cancelDelete(): void {
    this.userToDelete.set(null);
  }

  deleteUser(): void {
    const user = this.userToDelete();

    if (!user || this.deleting()) {
      return;
    }

    this.deleting.set(true);
    this.error.set('');

    this.userService
      .deleteUser(user.id)
      .pipe(
        catchError((error: unknown) => {
          this.error.set(error instanceof Error ? error.message : 'Failed to delete user.');
          return of(null);
        }),
        finalize(() => this.deleting.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((result) => {
        if (result === null) {
          return;
        }

        this.notification.set(`User "${user.name}" deleted successfully.`);
        this.userToDelete.set(null);

        const { page, total, limit } = this.pagination();
        const newTotal = Math.max(0, total - 1);
        const newTotalPages = Math.max(1, Math.ceil(newTotal / limit));

        this.pagination.update((p) => ({
          ...p,
          total: newTotal,
          totalPages: newTotalPages,
          page: Math.min(page, newTotalPages),
        }));

        this.loadUsers();
      });
  }

  dismissError(): void {
    this.error.set('');
  }

  dismissNotification(): void {
    this.notification.set('');
  }

  trackByUserId(_index: number, user: User): string {
    return user.id;
  }

  showEllipsisBefore(page: number): boolean {
    const pages = this.visiblePages;
    const index = pages.indexOf(page);

    return index > 0 && page - pages[index - 1] > 1;
  }
}
