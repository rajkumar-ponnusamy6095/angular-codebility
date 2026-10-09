
import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { PlainNavbar } from '../../core/layout/plain-navbar/plain-navbar';
import { AuthService } from '../../core/auth/auth.service';

type VerificationStatus = 'verifying' | 'success' | 'error';

@Component({
  selector: 'app-verify-email',
  standalone: true,
  imports: [RouterLink, PlainNavbar],
  templateUrl: './verify-email.html',
  styleUrl: './verify-email.css',
})
export class VerifyEmail implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly auth = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);

  readonly token = this.route.snapshot.queryParamMap.get('token')?.trim() ?? '';
  readonly hasValidToken = this.token.length > 0;

  readonly status = signal<VerificationStatus>(this.hasValidToken ? 'verifying' : 'error');

  readonly message = signal(this.hasValidToken
    ? ''
    : 'The email verification link is missing its token.');

  ngOnInit(): void {
    if (!this.hasValidToken) {
      return;
    }

    this.auth.verifyEmail(this.token).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: message => {
        this.message.set(message);
        this.status.set('success');
      },
      error: (error: unknown) => {
        this.message.set(error instanceof Error
          ? error.message
          : 'Failed to verify your email address.');
        this.status.set('error');
      }
    });
  }
}
