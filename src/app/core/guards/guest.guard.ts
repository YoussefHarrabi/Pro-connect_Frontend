import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth';

@Injectable({
  providedIn: 'root'
})
export class GuestGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(): boolean {
    if (this.authService.isLoggedIn()) {
      // User is already logged in, redirect to appropriate dashboard
      const user = this.authService.getCurrentUser();
      const redirectUrl = user ? this.authService.getRedirectUrlByRole(user.role) : '/project-discovery';
      this.router.navigate([redirectUrl]);
      return false;
    }
    // User is not logged in, allow access to login/register
    return true;
  }
}