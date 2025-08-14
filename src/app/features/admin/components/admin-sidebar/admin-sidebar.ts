import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

export interface SidebarMenuItem {
  id: string;
  label: string;
  icon: string;
  route?: string;
  action?: () => void;
  badge?: string;
  children?: SidebarMenuItem[];
}

@Component({
  selector: 'app-admin-sidebar',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    TranslateModule
  ],
  templateUrl: './admin-sidebar.html',
  styleUrls: ['./admin-sidebar.scss']
})
export class AdminSidebar {
  @Input() isCollapsed = false;
  @Input() activeItem = 'dashboard';
  @Output() itemSelected = new EventEmitter<string>();
  @Output() toggleSidebar = new EventEmitter<void>();

  menuItems: SidebarMenuItem[] = [
    {
      id: 'dashboard',
      label: 'ADMIN.SIDEBAR.DASHBOARD',
      icon: 'fas fa-tachometer-alt',
      route: '/admin-dashboard'
    },
    {
      id: 'users',
      label: 'ADMIN.SIDEBAR.USER_MANAGEMENT',
      icon: 'fas fa-users',
      route: '/admin/users'
    },
    {
      id: 'projects',
      label: 'ADMIN.SIDEBAR.PROJECT_MANAGEMENT',
      icon: 'fas fa-project-diagram',
      route: '/admin/projects'
    },
    {
      id: 'applications',
      label: 'ADMIN.SIDEBAR.APPLICATIONS',
      icon: 'fas fa-file-alt',
      route: '/admin/applications'
    },
    {
      id: 'payments',
      label: 'ADMIN.SIDEBAR.PAYMENTS',
      icon: 'fas fa-credit-card',
      route: '/admin/payments'
    },
    {
      id: 'reports',
      label: 'ADMIN.SIDEBAR.REPORTS',
      icon: 'fas fa-chart-bar',
      route: '/admin/reports'
    },
    {
      id: 'settings',
      label: 'ADMIN.SIDEBAR.SETTINGS',
      icon: 'fas fa-cog',
      route: '/admin/settings'
    }
  ];

  constructor(private router: Router) {}

  onItemClick(item: SidebarMenuItem): void {
    this.activeItem = item.id;
    this.itemSelected.emit(item.id);
    
    if (item.route) {
      this.router.navigate([item.route]);
    } else if (item.action) {
      item.action();
    }
  }

  onToggleSidebar(): void {
    this.toggleSidebar.emit();
  }
}
