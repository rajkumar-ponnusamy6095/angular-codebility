import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BadRequest } from './bad-request';

describe('BadRequest', () => {
  let component: BadRequest;
  let fixture: ComponentFixture<BadRequest>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BadRequest]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BadRequest);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
