
import { Component, input, inject } from '@angular/core';
import { Router } from '@angular/router';
import { PlainNavbar } from '../../../core/layout/plain-navbar/plain-navbar';

@Component({
  selector: 'app-error-page',
  standalone: true,
  imports: [PlainNavbar],
  templateUrl: './error-page.html',
  styleUrl: './error-page.css',
})
export class ErrorPage {
  private readonly router = inject(Router);

  readonly code = input.required<number>();
  readonly title = input.required<string>();
  readonly message = input.required<string>();
  readonly buttonText = input.required<string>();
  readonly buttonPath = input.required<string>();
  readonly retryButtonText = input<string>();

  navigateToButtonPath(): void {
    void this.router.navigateByUrl(this.buttonPath());
  }

  retry(): void {
    window.location.reload();
  }
}
