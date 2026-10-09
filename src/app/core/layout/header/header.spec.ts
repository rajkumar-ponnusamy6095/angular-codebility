import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { Header } from './header';

describe('Header', () => {
  let component: Header;
  let fixture: ComponentFixture<Header>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Header],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([])
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Header);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('keeps the theme selector synchronized with the current theme', async () => {
    component.themeService.setTheme('pink');
    fixture.detectChanges();
    await fixture.whenStable();

    const themeSelector = fixture.nativeElement.querySelector(
      '#app-theme-select'
    ) as HTMLSelectElement;

    expect(themeSelector.value).toBe('pink');
  });

  it('opens a profile menu before the theme selector', () => {
    fixture.componentRef.setInput('user', {
      name: 'Ada Lovelace',
      email: 'ada@example.com'
    });
    component.toggleProfileMenu();
    fixture.detectChanges();

    const actions = fixture.nativeElement.querySelector('.app-navbar-actions') as HTMLElement;
    const menu = actions.querySelector('.app-profile-dropdown') as HTMLElement;
    const themeControl = actions.querySelector('.app-theme-control') as HTMLElement;

    expect(menu).toBeTruthy();
    expect(menu.textContent).toContain('ada@example.com');
    expect(actions.children[0].contains(menu)).toBeTrue();
    expect(actions.children[0].compareDocumentPosition(themeControl) & Node.DOCUMENT_POSITION_FOLLOWING)
      .toBeTruthy();
  });
});
