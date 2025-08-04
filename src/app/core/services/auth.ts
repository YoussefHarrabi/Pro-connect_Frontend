import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { Router } from '@angular/router';

import {
  RegisterRequest,
  AuthenticationRequest,
  AuthenticationResponse,
  LoginCredentials
} from '../dto/auth';

import { User } from '../dto/user';
import { MessageResponse } from '../dto/common';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly API_URL = 'http://localhost:8081/api/auth';
  private readonly TOKEN_KEY = 'auth-token';
  private readonly USER_KEY = 'auth-user';

  private currentUserSubject = new BehaviorSubject<User | null>(this.getUserFromStorage());
  public currentUser$ = this.currentUserSubject.asObservable();

  private isLoggedInSubject = new BehaviorSubject<boolean>(this.hasValidToken());
  public isLoggedIn$ = this.isLoggedInSubject.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router
  ) {}

  /**
   * Register a new user
   */
  register(registerData: RegisterRequest): Observable<AuthenticationResponse> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    return this.http.post<AuthenticationResponse>(
      `${this.API_URL}/register`,
      registerData,
      { headers }
    ).pipe(
      tap(response => {
        if (response.token) {
          this.handleAuthenticationSuccess(response);
        }
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Authenticate user login
   */
  login(credentials: AuthenticationRequest): Observable<AuthenticationResponse> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    return this.http.post<AuthenticationResponse>(
      `${this.API_URL}/login`,
      credentials,
      { headers }
    ).pipe(
      tap(response => {
        if (response.token) {
          this.handleAuthenticationSuccess(response);
        }
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Logout user
   */
  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.currentUserSubject.next(null);
    this.isLoggedInSubject.next(false);
    this.router.navigate(['/auth/login']);
  }

  /**
   * Get current user
   */
  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  /**
   * Check if user is logged in
   */
  isLoggedIn(): boolean {
    return this.isLoggedInSubject.value;
  }

  /**
   * Get authentication token
   */
  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  /**
   * Check if user has a specific role
   */
  hasRole(role: string): boolean {
    const user = this.getCurrentUser();
    return user?.role === role;
  }

  /**
   * Get redirect URL based on role
   */
  getRedirectUrlByRole(role: string): string {
  switch (role) {
    case 'ROLE_CLIENT':
      return '/talent-discovery'; // Clients go to talent discovery to find freelancers/companies
    case 'ROLE_FREELANCER':
      return '/project-discovery'; // Freelancers go to project discovery to find projects
    case 'ROLE_SERVICE_COMPANY':
      return '/project-discovery'; // Service companies also go to project discovery to find projects
    case 'ROLE_ADMIN':
      return '/admin-dashboard';
    default:
      return '/project-discovery';
  }
}

  // Private helper methods
  private handleAuthenticationSuccess(response: AuthenticationResponse): void {
    localStorage.setItem(this.TOKEN_KEY, response.token);
    
    const user: User = {
      id: response.id,
      username: response.username,
      email: response.email,
      role: response.role
    };
    
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    this.currentUserSubject.next(user);
    this.isLoggedInSubject.next(true);
  }

  private getUserFromStorage(): User | null {
    try {
      const userStr = localStorage.getItem(this.USER_KEY);
      return userStr ? JSON.parse(userStr) : null;
    } catch {
      return null;
    }
  }

  hasAnyRole(roles: string[]): boolean {
  const user = this.getCurrentUser();
  if (!user?.role) return false;
  return roles.includes(user.role);
}
  private hasValidToken(): boolean {
    const token = localStorage.getItem(this.TOKEN_KEY);
    if (!token) return false;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Math.floor(Date.now() / 1000);
      return payload.exp ? payload.exp > currentTime : true;
    } catch {
      return false;
    }
  }

  private handleError = (error: any): Observable<never> => {
    let errorMessage = 'An error occurred';
    
    if (error.error?.message) {
      errorMessage = error.error.message;
    } else if (error.message) {
      errorMessage = error.message;
    } else if (typeof error.error === 'string') {
      errorMessage = error.error;
    }

    console.error('Auth Service Error:', error);
    return throwError(() => new Error(errorMessage));
  };
}