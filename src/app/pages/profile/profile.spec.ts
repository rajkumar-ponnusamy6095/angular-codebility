import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { AuthService } from '../../core/auth/auth.service';
import { CurrentAccount } from '../../core/models/account';
import { User } from '../users/user.model';
import { UserService } from '../users/user.service';
import { Profile } from './profile';

describe('Profile', () => {
  let component: Profile;
  let fixture: ComponentFixture<Profile>;
  let auth: jasmine.SpyObj<AuthService>;
  let users: jasmine.SpyObj<UserService>;

  const account: CurrentAccount = {
    id: 'account-1',
    email: 'ada@example.com',
    firstName: 'Ada',
    lastName: 'Lovelace',
    name: 'Ada Lovelace',
    gender: 'female',
    phone: '+1 (555) 123-4567',
    department: 'Engineering',
    status: 'active',
    role: 'USER',
    createdAt: '2025-01-01T00:00:00.000Z',
    isVerified: true
  };

  const user: User = {
    ...account,
    role: 'user',
    gender: 'female'
  };

  beforeEach(async () => {
    auth = jasmine.createSpyObj<AuthService>('AuthService', ['getMe', 'changePassword'], {
      account: jasmine.createSpyObj('account signal', ['set'])
    });
    auth.getMe.and.returnValue(of(account));
    auth.changePassword.and.returnValue(of(undefined));
    users = jasmine.createSpyObj<UserService>('UserService', ['updateMyProfile']);
    users.updateMyProfile.and.returnValue(of(user));

    await TestBed.configureTestingModule({
      imports: [Profile],
      providers: [
        provideZonelessChangeDetection(),
        { provide: AuthService, useValue: auth },
        { provide: UserService, useValue: users }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Profile);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
    expect(component.account()).toEqual(account);
  });

  it('requires valid personal details before sending an update', () => {
    component.startEditing();
    component.profileForm.controls.email.setValue('not-an-email');
    component.saveProfile();

    expect(component.profileForm.controls.email.touched).toBeTrue();
    expect(users.updateMyProfile).not.toHaveBeenCalled();
  });

  it('requires a department from the approved list', () => {
    component.startEditing();
    component.profileForm.controls.department.setValue('Sales');
    component.saveProfile();

    expect(component.profileForm.controls.department.invalid).toBeTrue();
    expect(users.updateMyProfile).not.toHaveBeenCalled();
  });

  it('updates the profile through the account API', () => {
    component.startEditing();
    component.profileForm.controls.firstName.setValue('Augusta');
    component.saveProfile();

    expect(users.updateMyProfile).toHaveBeenCalledWith('account-1', jasmine.objectContaining({
      firstName: 'Augusta',
      role: 'user',
      status: 'active'
    }));
    expect(component.account()?.firstName).toBe('Ada');
    expect(component.successMessage()).toBe('Your profile has been updated.');
  });

  it('requires matching, changed passwords before requesting a password update', () => {
    component.passwordForm.setValue({
      oldPassword: 'current-pass',
      newPassword: 'different-pass',
      confirmPassword: 'not-matching'
    });
    component.changePassword();

    expect(auth.changePassword).not.toHaveBeenCalled();
    expect(component.passwordForm.hasError('passwordMismatch')).toBeTrue();
  });
});
