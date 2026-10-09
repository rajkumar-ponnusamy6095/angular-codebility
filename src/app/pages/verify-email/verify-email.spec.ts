import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { of, Subject } from 'rxjs';

import { AuthService } from '../../core/auth/auth.service';
import { VerifyEmail } from './verify-email';

describe('VerifyEmail', () => {
  let component: VerifyEmail;
  let fixture: ComponentFixture<VerifyEmail>;
  let queryToken: string;
  let auth: jasmine.SpyObj<AuthService>;

  beforeEach(async () => {
    queryToken = '   ';
    auth = jasmine.createSpyObj<AuthService>('AuthService', ['verifyEmail']);
    auth.verifyEmail.and.returnValue(of('Your email address has been verified successfully.'));

    await TestBed.configureTestingModule({
      imports: [VerifyEmail],
      providers: [
        provideZonelessChangeDetection(),
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { queryParamMap: { get: () => queryToken } } },
        },
        { provide: AuthService, useValue: auth },
      ],
    }).compileComponents();
  });

  it('should create', () => {
    createFixture();
    expect(component).toBeTruthy();
  });

  it('rejects an empty verification token', () => {
    createFixture();
    expect(component.hasValidToken).toBeFalse();
    expect(component.status()).toBe('error');
    expect(component.message()).toContain('missing its token');
  });

  it('shows success after the API returns a verification token', () => {
    queryToken = 'verify-token';
    createFixture();

    expect(auth.verifyEmail).toHaveBeenCalledWith('verify-token');
    expect(component.status()).toBe('success');
    expect(fixture.nativeElement.textContent).toContain(
      'Your email address has been verified successfully.'
    );
    expect(fixture.nativeElement.textContent).not.toContain('Verifying your email address...');
  });

  it('shows the API error instead of remaining in the verifying state', () => {
    const response = new Subject<string>();
    auth.verifyEmail.and.returnValue(response);
    queryToken = 'verify-token';
    createFixture();

    expect(component.status()).toBe('verifying');
    response.error(new Error('This verification link has expired.'));
    fixture.detectChanges();

    expect(component.status()).toBe('error');
    expect(component.message()).toBe('This verification link has expired.');
    expect(fixture.nativeElement.textContent).toContain('This verification link has expired.');
    expect(fixture.nativeElement.textContent).not.toContain('Verifying your email address...');
  });

  function createFixture(): void {
    fixture = TestBed.createComponent(VerifyEmail);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }
});
