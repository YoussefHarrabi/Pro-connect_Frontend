import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, Router } from '@angular/router';
import { AuthService } from '../services/auth';

@Injectable({
  providedIn: 'root'
})
export class RoleGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(route: ActivatedRouteSnapshot): boolean {
    const requiredRoles = route.data['roles'] || [route.data['role']]; // Support both 'roles' array and single 'role'
    
    if (this.authService.isLoggedIn()) {
      const user = this.authService.getCurrentUser();
      if (user && requiredRoles.includes(user.role)) {
        return true;
      }
    }
    
    this.router.navigate(['/auth/login']);
    return false;
  }
}