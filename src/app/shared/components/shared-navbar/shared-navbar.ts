import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AuthService } from '../../../core/services/auth';

export interface NavbarConfig {
  title: string;
  showLanguageToggle?: boolean;
  showProfileLink?: boolean;
  showLogoutButton?: boolean;
  customButtons?: NavbarButton[];
}

export interface NavbarButton {
  label: string;
  route?: string;
  action?: () => void;
  class?: string;
  icon?: string;
}

@Component({
  selector: 'app-shared-navbar',
  imports: [
    CommonModule,
    RouterModule,
    TranslateModule
  ],
  templateUrl: './shared-navbar.html',
  styleUrl: './shared-navbar.scss'
})
export class SharedNavbar implements OnInit {
  @Input() config: NavbarConfig = {
    title: 'Dashboard',
    showLanguageToggle: true,
    showProfileLink: true,
    showLogoutButton: true
  };

  currentLanguage = 'en';
  currentUser$;
  isLoggedIn$;

  constructor(
    private router: Router,
    private translate: TranslateService,
    private authService: AuthService
  ) {
    this.currentUser$ = this.authService.currentUser$;
    this.isLoggedIn$ = this.authService.isLoggedIn$;
  }

  ngOnInit(): void {
    // Set default language if not already set
    if (!this.translate.currentLang) {
      this.translate.setDefaultLang('en');
      this.translate.use('en');
    }
    this.currentLanguage = this.translate.currentLang || 'en';
  }

  toggleLanguage(lang: string): void {
    this.translate.use(lang);
    this.currentLanguage = lang;
  }

  navigateToProfile(): void {
    this.router.navigate(['/profile']);
  }

  logout(): void {
    // Use AuthService to handle proper logout logic
    console.log('Logging out user...');
    this.authService.logout();
  }

  executeCustomAction(button: NavbarButton): void {
    if (button.route) {
      this.router.navigate([button.route]);
    } else if (button.action) {
      button.action();
    }
  }

  hasActiveWorkspace(): boolean {
    // Mock logic to check if user has active workspace
    // In real app, this would check user's active projects
    return true;
  }

  getUserRoleClass(role: string): string {
    switch (role) {
      case 'ROLE_ADMIN':
        return 'bg-purple-100 text-purple-800';
      case 'ROLE_CLIENT':
        return 'bg-blue-100 text-blue-800';
      case 'ROLE_FREELANCER':
        return 'bg-green-100 text-green-800';
      case 'ROLE_SERVICE_COMPANY':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  getUserRoleDisplay(role: string): string {
    switch (role) {
      case 'ROLE_ADMIN':
        return 'Admin';
      case 'ROLE_CLIENT':
        return 'Client';
      case 'ROLE_FREELANCER':
        return 'Freelancer';
      case 'ROLE_SERVICE_COMPANY':
        return 'Service Company';
      default:
        return 'User';
    }
  }
}
