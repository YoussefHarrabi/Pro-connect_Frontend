// src/app/shared/services/admin-user.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

// ============= USER MANAGEMENT INTERFACES =============

export interface UserSearchRequest {
  searchTerm?: string;
  role?: string;
  verificationStatus?: string;
  verified?: boolean;
  page?: number;
  size?: number;
  sortBy?: string;
  sortDirection?: string;
}

export interface UserSummaryDto {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  profilePictureUrl?: string;
  verified: boolean;
  verificationStatus: string;
  roles: string[];
  lastActive?: string;
  createdAt: string;
}

export interface UserDetailDto {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  address?: string;
  bio?: string;
  profilePictureUrl?: string;
  location?: string;
  hourlyRate?: number;
  averageRating: number;
  totalReviews: number;
  verified: boolean;
  verificationStatus: string;
  roles: string[];
  lastActive?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserManagementResponse {
  users: UserSummaryDto[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
  isFirst: boolean;
  isLast: boolean;
}

export interface CreateUserRequest {
  username: string;
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  bio?: string;
  location?: string;
  hourlyRate?: number;
  roleNames: string[];
  verified?: boolean;
  verificationStatus?: string;
}

export interface UpdateUserRequest {
  firstName?: string;
  lastName?: string;
  email?: string;
  phoneNumber?: string;
  bio?: string;
  location?: string;
  hourlyRate?: number;
  roleNames?: string[];
  verified?: boolean;
  verificationStatus?: string;
}

export interface UserStatisticsDto {
  totalUsers: number;
  verifiedUsers: number;
  pendingVerification: number;
  activeThisMonth: number;
  freelancers: number;
  clients: number;
  serviceCompanies: number;
  verificationRate: number;
}

export interface ApiResponse<T> {
  message: string;
  data?: T;
  error?: string;
  timestamp?: string;
}

// ============= ENUMS =============

export enum UserRole {
  ADMIN = 'ADMIN',
  CLIENT = 'CLIENT',
  FREELANCER = 'FREELANCER',
  SERVICE_COMPANY = 'SERVICE_COMPANY'
}

export enum VerificationStatus {
  PENDING = 'PENDING',
  VERIFIED = 'VERIFIED',
  REJECTED = 'REJECTED'
}

@Injectable({
  providedIn: 'root'
})
export class AdminUserService {
  private readonly API_URL = 'http://localhost:8081/api/users/management';
  private readonly TOKEN_KEY = 'auth-token';

  constructor(private http: HttpClient) {
    const currentUser = this.getCurrentUsername();
    console.log('🚀 AdminUserService initialized for:', currentUser || 'Not authenticated');
  }

  // ============= USER MANAGEMENT ENDPOINTS =============

  /**
   * Get all users with pagination and filtering - Admin only
   */
  getAllUsers(searchRequest: UserSearchRequest = {}): Observable<UserManagementResponse> {
    console.log('📋 AdminUserService: Getting all users with filters:', searchRequest);

    // Build query parameters
    let params = new HttpParams();
    
    if (searchRequest.searchTerm) {
      params = params.set('searchTerm', searchRequest.searchTerm);
    }
    if (searchRequest.role) {
      params = params.set('role', searchRequest.role);
    }
    if (searchRequest.verificationStatus) {
      params = params.set('verificationStatus', searchRequest.verificationStatus);
    }
    if (searchRequest.verified !== undefined) {
      params = params.set('verified', searchRequest.verified.toString());
    }
    if (searchRequest.page !== undefined) {
      params = params.set('page', searchRequest.page.toString());
    }
    if (searchRequest.size !== undefined) {
      params = params.set('size', searchRequest.size.toString());
    }
    if (searchRequest.sortBy) {
      params = params.set('sortBy', searchRequest.sortBy);
    }
    if (searchRequest.sortDirection) {
      params = params.set('sortDirection', searchRequest.sortDirection);
    }

    return this.http.get<UserManagementResponse>(this.API_URL, {
      headers: this.getHeaders(),
      params: params
    }).pipe(
      catchError(error => {
        console.error('❌ Error getting all users:', error);
        return throwError(() => this.handleError(error));
      })
    );
  }

  /**
   * Get user by ID - Admin only
   */
  getUserById(userId: number): Observable<UserDetailDto> {
    console.log('🔍 AdminUserService: Getting user by ID:', userId);

    return this.http.get<UserDetailDto>(`${this.API_URL}/${userId}`, {
      headers: this.getHeaders()
    }).pipe(
      catchError(error => {
        console.error('❌ Error getting user by ID:', error);
        return throwError(() => this.handleError(error));
      })
    );
  }

  /**
   * Create new user - Admin only
   */
  createUser(request: CreateUserRequest): Observable<UserDetailDto> {
    console.log('🔄 AdminUserService: Creating new user:', request.username);

    return this.http.post<UserDetailDto>(this.API_URL, request, {
      headers: this.getHeaders()
    }).pipe(
      catchError(error => {
        console.error('❌ Error creating user:', error);
        return throwError(() => this.handleError(error));
      })
    );
  }

  /**
   * Update user - Admin only
   */
  updateUser(userId: number, request: UpdateUserRequest): Observable<UserDetailDto> {
    console.log('🔄 AdminUserService: Updating user ID:', userId);

    return this.http.put<UserDetailDto>(`${this.API_URL}/${userId}`, request, {
      headers: this.getHeaders()
    }).pipe(
      catchError(error => {
        console.error('❌ Error updating user:', error);
        return throwError(() => this.handleError(error));
      })
    );
  }

  /**
   * Delete user - Admin only
   */
  deleteUser(userId: number): Observable<ApiResponse<any>> {
    console.log('🗑️ AdminUserService: Deleting user ID:', userId);

    return this.http.delete<ApiResponse<any>>(`${this.API_URL}/${userId}`, {
      headers: this.getHeaders()
    }).pipe(
      catchError(error => {
        console.error('❌ Error deleting user:', error);
        return throwError(() => this.handleError(error));
      })
    );
  }

  /**
   * Mark user as verified - Admin only
   */
  markUserAsVerified(userId: number): Observable<UserDetailDto> {
    console.log('✅ AdminUserService: Marking user as verified, ID:', userId);

    return this.http.put<UserDetailDto>(`${this.API_URL}/${userId}/verify`, {}, {
      headers: this.getHeaders()
    }).pipe(
      catchError(error => {
        console.error('❌ Error verifying user:', error);
        return throwError(() => this.handleError(error));
      })
    );
  }

  /**
   * Get user statistics - Admin only
   */
  getUserStatistics(): Observable<UserStatisticsDto> {
    console.log('📊 AdminUserService: Getting user statistics');

    return this.http.get<UserStatisticsDto>(`${this.API_URL}/statistics`, {
      headers: this.getHeaders()
    }).pipe(
      catchError(error => {
        console.error('❌ Error getting user statistics:', error);
        return throwError(() => this.handleError(error));
      })
    );
  }

  // ============= HELPER METHODS =============

  /**
   * Search users by username or email
   */
  searchUsers(searchTerm: string, page: number = 0, size: number = 10): Observable<UserManagementResponse> {
    console.log('🔍 AdminUserService: Searching users:', searchTerm);

    const searchRequest: UserSearchRequest = {
      searchTerm: searchTerm,
      page: page,
      size: size,
      sortBy: 'createdAt',
      sortDirection: 'desc'
    };

    return this.getAllUsers(searchRequest);
  }

  /**
   * Get users by role
   */
  getUsersByRole(role: UserRole, page: number = 0, size: number = 10): Observable<UserManagementResponse> {
    console.log('👥 AdminUserService: Getting users by role:', role);

    const searchRequest: UserSearchRequest = {
      role: role,
      page: page,
      size: size,
      sortBy: 'createdAt',
      sortDirection: 'desc'
    };

    return this.getAllUsers(searchRequest);
  }

  /**
   * Get users by verification status
   */
  getUsersByVerificationStatus(status: VerificationStatus, page: number = 0, size: number = 10): Observable<UserManagementResponse> {
    console.log('✅ AdminUserService: Getting users by verification status:', status);

    const searchRequest: UserSearchRequest = {
      verificationStatus: status,
      page: page,
      size: size,
      sortBy: 'createdAt',
      sortDirection: 'desc'
    };

    return this.getAllUsers(searchRequest);
  }

  /**
   * Get verified users only
   */
  getVerifiedUsers(page: number = 0, size: number = 10): Observable<UserManagementResponse> {
    console.log('✅ AdminUserService: Getting verified users');

    const searchRequest: UserSearchRequest = {
      verified: true,
      page: page,
      size: size,
      sortBy: 'createdAt',
      sortDirection: 'desc'
    };

    return this.getAllUsers(searchRequest);
  }

  /**
   * Get unverified users only
   */
  getUnverifiedUsers(page: number = 0, size: number = 10): Observable<UserManagementResponse> {
    console.log('❌ AdminUserService: Getting unverified users');

    const searchRequest: UserSearchRequest = {
      verified: false,
      page: page,
      size: size,
      sortBy: 'createdAt',
      sortDirection: 'desc'
    };

    return this.getAllUsers(searchRequest);
  }

  // ============= UTILITY METHODS =============

  /**
   * Check if current user has admin privileges
   */
// Update this method in your AdminUserService

/**
 * Check if current user has admin privileges
 */
isAdminUser(): boolean {
  const token = this.getToken();
  if (!token) {
    console.log('❌ No token found');
    return false;
  }

  console.log('🔑 Token found:', token);

  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    console.log('🔍 Token payload:', payload);
    
    // Check different possible role fields in the JWT
    const roles = payload.roles || payload.role || payload.authorities || [];
    const username = payload.sub || payload.username;
    
    console.log('🔑 AdminUserService: Username:', username);
    console.log('🔑 AdminUserService: Checking roles:', roles);
    
    // For , we can check multiple ways:
    
    // 1. Check if username is 'admin' (your current token shows sub: "admin")
    if (username === 'admin') {
      console.log('✅ Admin access granted for admin user');
      return true;
    }
    
    // 2. Check if username is  and give admin access
    if (username === '') {
      console.log('✅ Admin access granted for ');
      return true;
    }
    
    // 3. Check roles array for admin roles
    if (Array.isArray(roles)) {
      const hasAdminRole = roles.some(role => 
        role === 'ROLE_ADMIN' || 
        role === 'ADMIN' || 
        role === 'admin' ||
        role.toUpperCase().includes('ADMIN')
      );
      
      if (hasAdminRole) {
        console.log('✅ Admin access granted via roles');
        return true;
      }
    }
    
    // 4. Check if roles is a string instead of array
    if (typeof roles === 'string') {
      const hasAdminRole = roles.includes('ADMIN') || roles.includes('admin');
      if (hasAdminRole) {
        console.log('✅ Admin access granted via role string');
        return true;
      }
    }
    
    console.log('❌ No admin privileges found');
    return false;
    
  } catch (error) {
    console.warn('⚠️ Could not parse roles from token:', error);
    return false;
  }
}

  /**
   * Format user full name
   */
  getUserFullName(user: UserSummaryDto | UserDetailDto): string {
    const firstName = user.firstName || '';
    const lastName = user.lastName || '';
    const fullName = `${firstName} ${lastName}`.trim();
    return fullName || user.username;
  }

  /**
   * Get user role display names
   */
  getRoleDisplayNames(roles: string[]): string[] {
    const roleDisplayMap: { [key: string]: string } = {
      'ADMIN': 'Administrator',
      'CLIENT': 'Client',
      'FREELANCER': 'Freelancer',
      'SERVICE_COMPANY': 'Service Company'
    };

    return roles.map(role => roleDisplayMap[role] || role);
  }

  /**
   * Get verification status display name
   */
  getVerificationStatusDisplay(status: string): string {
    const statusMap: { [key: string]: string } = {
      'PENDING': 'Pending Verification',
      'VERIFIED': 'Verified',
      'REJECTED': 'Verification Rejected'
    };

    return statusMap[status] || status;
  }

  /**
   * Get verification status color class
   */
  getVerificationStatusClass(status: string): string {
    const statusClasses: { [key: string]: string } = {
      'PENDING': 'bg-yellow-100 text-yellow-800',
      'VERIFIED': 'bg-green-100 text-green-800',
      'REJECTED': 'bg-red-100 text-red-800'
    };

    return statusClasses[status] || 'bg-gray-100 text-gray-800';
  }

  /**
   * Format date for display
   */
  formatDate(dateString: string): string {
    if (!dateString) return 'N/A';

    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(date);
    } catch (error) {
      console.warn('⚠️ Invalid date format:', dateString);
      return dateString;
    }
  }

  /**
   * Get relative time (e.g., "2 days ago")
   */
  getRelativeTime(dateString: string): string {
    if (!dateString) return 'Never';

    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffMinutes = Math.floor(diffMs / (1000 * 60));

      if (diffDays > 0) {
        return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
      } else if (diffHours > 0) {
        return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
      } else if (diffMinutes > 0) {
        return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
      } else {
        return 'Just now';
      }
    } catch (error) {
      console.warn('⚠️ Invalid date format:', dateString);
      return 'Unknown';
    }
  }

  /**
   * Validate user data
   */
  validateUserData(userData: CreateUserRequest | UpdateUserRequest): string[] {
    const errors: string[] = [];

    if ('username' in userData) {
      // CreateUserRequest validation
      const createData = userData as CreateUserRequest;
      
      if (!createData.username || createData.username.length < 3) {
        errors.push('Username must be at least 3 characters long');
      }
      
      if (!createData.email || !this.isValidEmail(createData.email)) {
        errors.push('Valid email is required');
      }
      
      if (!createData.password || createData.password.length < 6) {
        errors.push('Password must be at least 6 characters long');
      }
      
      if (!createData.roleNames || createData.roleNames.length === 0) {
        errors.push('At least one role must be selected');
      }
    }

    if ('email' in userData && userData.email && !this.isValidEmail(userData.email)) {
      errors.push('Valid email format is required');
    }

    return errors;
  }

  /**
   * Validate email format
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // ============= AUTHENTICATION AND TOKEN METHODS =============

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    const token = this.getToken();
    return !!token && !this.isTokenExpired(token);
  }

  /**
   * Get authentication token
   */
  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  /**
   * Get current username from token
   */
  getCurrentUsername(): string | null {
    const token = this.getToken();
    if (!token) {
      return null;
    }

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.sub || payload.username || null;
    } catch (error) {
      console.warn('⚠️ Could not parse username from token');
      return null;
    }
  }

  /**
   * Check if token is expired
   */
  private isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Math.floor(Date.now() / 1000);
      return payload.exp < currentTime;
    } catch (error) {
      console.warn('⚠️ Invalid token format');
      return true;
    }
  }

  /**
   * Get HTTP headers with authentication
   */
  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem(this.TOKEN_KEY);
    const currentUser = this.getCurrentUsername();
    
    console.log('🔑 AdminUserService: Getting headers for user:', currentUser);
    console.log('🔑 Token found:', token ? 'Yes' : 'No');
    
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    });
  }

  /**
   * Handle HTTP errors
   */
  private handleError(error: any): string {
    const currentUser = this.getCurrentUsername();
    console.error('🚨 AdminUserService Error Details for user:', currentUser);
    console.error('🚨 Error:', error);
    
    if (error.status === 401) {
      console.error('❌ Unauthorized - Token may be invalid or expired');
      return 'Your session has expired. Please log in again.';
    }
    
    if (error.status === 403) {
      console.error('❌ Forbidden - User may not have admin permission');
      return 'You do not have permission to perform this action. Admin access required.';
    }
    
    if (error.status === 404) {
      return 'The requested resource was not found.';
    }
    
    if (error.status === 409) {
      return 'Conflict - Username or email already exists.';
    }
    
    if (error.status === 0) {
      console.error('❌ Network error - Backend may not be running');
      return 'Network error. Please check your connection and try again.';
    }
    
    if (error.error?.message) {
      return error.error.message;
    }
    
    if (error.message) {
      return error.message;
    }
    
    return 'An unexpected error occurred. Please try again.';
  }

  // ============= DEBUG METHODS =============

  /**
   * Get service info for debugging
   */
  getServiceInfo(): any {
    return {
      serviceName: 'AdminUserService',
      apiUrl: this.API_URL,
      currentUser: this.getCurrentUsername(),
      isAuthenticated: this.isAuthenticated(),
      isAdmin: this.isAdminUser(),
      tokenExists: !!this.getToken(),
      timestamp: new Date('2025-08-13T22:53:47Z').toISOString()
    };
  }

  /**
   * Log service status
   */
  logServiceStatus(): void {
    const info = this.getServiceInfo();
    console.log('📊 AdminUserService Status:', info);
  }
}