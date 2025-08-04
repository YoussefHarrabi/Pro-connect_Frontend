import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

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

  constructor(
    private router: Router,
    private translate: TranslateService
  ) {}

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
    // In a real app, this would handle logout logic
    console.log('Logout clicked');
    this.router.navigate(['/auth/login']);
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
}
