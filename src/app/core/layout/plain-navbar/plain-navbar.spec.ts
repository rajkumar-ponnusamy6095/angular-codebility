import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PlainNavbar } from './plain-navbar';

describe('PlainNavbar', () => {
  let component: PlainNavbar;
  let fixture: ComponentFixture<PlainNavbar>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PlainNavbar]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PlainNavbar);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
