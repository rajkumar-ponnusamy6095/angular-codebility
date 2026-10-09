
import { Component, input, output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

interface SidebarItem {
  label: string;
  path: string;
  icon: string;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css'
})
export class Sidebar {
  readonly isOpen = input(true);
  readonly navigationSelected = output<void>();

  readonly sidebarItems: SidebarItem[] = [
    {
      label: 'Overview',
      path: '/dashboard',
      icon: 'bi-grid-fill'
    },
    {
      label: 'Users',
      path: '/users',
      icon: 'bi-people-fill'
    }
  ];

  onNavigationSelected(): void {
    this.navigationSelected.emit();
  }
}
