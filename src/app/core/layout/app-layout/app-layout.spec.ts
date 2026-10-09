import { provideZonelessChangeDetection } from '@angular/core';
import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';

import { AuthService } from '../../auth/auth.service';
import { CurrentAccount } from '../../models/account';
import { AppLayout } from './app-layout';

describe('AppLayout', () => {
  let component: AppLayout;
  let fixture: ComponentFixture<AppLayout>;
  let auth: jasmine.SpyObj<AuthService>;

  beforeEach(async () => {
    auth = jasmine.createSpyObj<AuthService>(
      'AuthService',
      ['logout', 'getMe'],
      { account: signal<CurrentAccount | null>(null), isAuthenticated: false }
    );

    await TestBed.configureTestingModule({
      imports: [AppLayout],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        { provide: AuthService, useValue: auth }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AppLayout);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('clears the session and navigates to login when logging out', async () => {
    const router = TestBed.inject(Router);
    const navigate = spyOn(router, 'navigate').and.resolveTo(true);

    component.handleLogout();
    await fixture.whenStable();

    expect(auth.logout).toHaveBeenCalled();
    expect(component.currentUser()).toBeNull();
    expect(navigate).toHaveBeenCalledWith(['/login']);
    expect(component.logoutError()).toBe('');
  });

  it('reports a navigation failure after clearing the session', async () => {
    const router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.resolveTo(false);

    component.handleLogout();
    await fixture.whenStable();

    expect(auth.logout).toHaveBeenCalled();
    expect(component.logoutError()).toBe(
      'You have been signed out, but could not be redirected to login.'
    );
  });
});
