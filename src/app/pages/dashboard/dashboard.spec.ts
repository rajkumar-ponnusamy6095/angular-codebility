import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { Dashboard } from './dashboard';
import { UserService } from '../users/user.service';

describe('Dashboard', () => {
  let component: Dashboard;
  let fixture: ComponentFixture<Dashboard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Dashboard],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        {
          provide: UserService,
          useValue: {
            getUsers: jasmine.createSpy().and.returnValues(
              of({ data: [], pagination: { total: 12 } }),
              of({ data: [], pagination: { total: 9 } }),
              of({ data: [], pagination: { total: 3 } })
            )
          }
        }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Dashboard);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should show totals from the user service', () => {
    expect(component.overview()).toEqual({
      total: 12,
      active: 9,
      admins: 3
    });
  });
});
