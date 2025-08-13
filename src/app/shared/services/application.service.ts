import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

// ✅ Application interfaces
export interface ApplicationDto {
  id: number;
  projectId: number;
  projectTitle: string;
  applicantUsername: string;
  coverLetter: string;
  proposedBudget: number;
  proposedTimeline: string;
  hourlyRate?: number;
  additionalQuestions?: string;
  attachmentPaths?: string;
  selectedPortfolioItems?: string;
  status: ApplicationStatus;
  createdAt: string;
}

export interface ApplicationRequest {
  coverLetter: string;
  proposedBudget: number;
  proposedTimeline: string;
  hourlyRate?: number;
  additionalQuestions?: string;
  attachmentPaths?: string;
  selectedPortfolioItems?: string;
}

export interface ApplicationSummary {
  totalApplications: number;
  pendingApplications: number;
  acceptedApplications: number;
  rejectedApplications: number;
  underReviewApplications: number;
}

export interface ApplicationFilters {
  status?: ApplicationStatus;
  projectId?: number;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

export enum ApplicationStatus {
  PENDING = 'PENDING',
  UNDER_REVIEW = 'UNDER_REVIEW',
  SHORTLISTED = 'SHORTLISTED',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  WITHDRAWN = 'WITHDRAWN',
  INTERVIEW_REQUESTED = 'INTERVIEW_REQUESTED',
  OFFER_SENT = 'OFFER_SENT'
}

@Injectable({
  providedIn: 'root'
})
export class ApplicationService {
  private API_URL = 'http://localhost:8081/api';
  private readonly TOKEN_KEY = 'auth-token';

  // ✅ State management
  private applicationsSubject = new BehaviorSubject<ApplicationDto[]>([]);
  public applications$ = this.applicationsSubject.asObservable();
  
  private myApplicationsSubject = new BehaviorSubject<ApplicationDto[]>([]);
  public myApplications$ = this.myApplicationsSubject.asObservable();
  
  private clientApplicationsSubject = new BehaviorSubject<ApplicationDto[]>([]);
  public clientApplications$ = this.clientApplicationsSubject.asObservable();
  
  private loadingSubject = new BehaviorSubject<boolean>(false);
  public loading$ = this.loadingSubject.asObservable();

  constructor(private http: HttpClient) {
    const currentUser = this.getCurrentUsername();
    console.log('🚀 ApplicationService initialized - Current user:', currentUser || 'Not authenticated');
  }

  // ✅ Apply to project
  applyToProject(projectId: number, applicationData: ApplicationRequest): Observable<ApplicationDto> {
    const currentUser = this.getCurrentUsername();
    console.log('📝 ApplicationService: Applying to project:', projectId);
    console.log('📝 Application data:', applicationData);
    console.log('👤 Current user:', currentUser);
    
    this.setLoading(true);
    
    return this.http.post<ApplicationDto>(`${this.API_URL}/projects/${projectId}/apply`, applicationData, {
      headers: this.getHeaders()
    }).pipe(
      map(response => {
        console.log('✅ Application submitted successfully:', response);
        this.setLoading(false);
        
        // Update my applications list
        this.refreshMyApplications();
        
        return response;
      }),
      catchError(error => {
        console.error('❌ Error applying to project:', error);
        console.error('❌ Error status:', error.status);
        console.error('❌ Error message:', error.message);
        this.setLoading(false);
        return throwError(() => this.handleError(error));
      })
    );
  }

  // ✅ Get applications for a project (for clients)
  getApplicationsForProject(projectId: number): Observable<ApplicationDto[]> {
    console.log('📋 Getting applications for project:', projectId);
    
    this.setLoading(true);
    
    return this.http.get<ApplicationDto[]>(`${this.API_URL}/projects/${projectId}/applications`, {
      headers: this.getHeaders()
    }).pipe(
      map(response => {
        console.log('✅ Applications loaded:', response.length);
        this.applicationsSubject.next(response);
        this.setLoading(false);
        return response;
      }),
      catchError(error => {
        console.error('❌ Error loading applications:', error);
        this.setLoading(false);
        return throwError(() => this.handleError(error));
      })
    );
  }

  // ✅ NEW: Get all applications for client's projects
  getApplicationsForMyProjects(): Observable<ApplicationDto[]> {
    const currentUser = this.getCurrentUsername();
    console.log('📋 Getting applications for my projects (as client) for user:', currentUser);
    
    this.setLoading(true);
    
    return this.http.get<ApplicationDto[]>(`${this.API_URL}/applications/for-my-projects`, {
      headers: this.getHeaders()
    }).pipe(
      map(response => {
        console.log('✅ Client applications loaded:', response.length);
        this.clientApplicationsSubject.next(response);
        this.setLoading(false);
        return response;
      }),
      catchError(error => {
        console.error('❌ Error loading client applications:', error);
        this.setLoading(false);
        return throwError(() => this.handleError(error));
      })
    );
  }

  // ✅ Get my applications (for freelancers)
  getMyApplications(): Observable<ApplicationDto[]> {
    const currentUser = this.getCurrentUsername();
    console.log('📋 Getting my applications (as freelancer) for user:', currentUser);
    
    this.setLoading(true);
    
    return this.http.get<ApplicationDto[]>(`${this.API_URL}/applications/my`, {
      headers: this.getHeaders()
    }).pipe(
      map(response => {
        console.log('✅ My applications loaded:', response.length);
        this.myApplicationsSubject.next(response);
        this.setLoading(false);
        return response;
      }),
      catchError(error => {
        console.error('❌ Error loading my applications:', error);
        this.setLoading(false);
        return throwError(() => this.handleError(error));
      })
    );
  }

  // ✅ Update application status (for clients)
  updateApplicationStatus(applicationId: number, status: ApplicationStatus): Observable<ApplicationDto> {
    const currentUser = this.getCurrentUsername();
    console.log('📝 Updating application status:', applicationId, 'to:', status, 'by user:', currentUser);
    
    this.setLoading(true);
    
    return this.http.patch<ApplicationDto>(`${this.API_URL}/applications/${applicationId}/status`, 
      { status }, 
      { headers: this.getHeaders() }
    ).pipe(
      map(response => {
        console.log('✅ Application status updated successfully:', response);
        this.setLoading(false);
        
        // Update local state
        this.refreshClientApplications();
        
        return response;
      }),
      catchError(error => {
        console.error('❌ Error updating application status:', error);
        this.setLoading(false);
        return throwError(() => this.handleError(error));
      })
    );
  }

  // ✅ Withdraw application
  withdrawApplication(applicationId: number): Observable<void> {
    console.log('🗑️ Withdrawing application:', applicationId);
    
    this.setLoading(true);
    
    return this.http.delete<void>(`${this.API_URL}/applications/${applicationId}`, {
      headers: this.getHeaders()
    }).pipe(
      map(() => {
        console.log('✅ Application withdrawn successfully');
        this.setLoading(false);
        
        // Update my applications list
        this.refreshMyApplications();
      }),
      catchError(error => {
        console.error('❌ Error withdrawing application:', error);
        this.setLoading(false);
        return throwError(() => this.handleError(error));
      })
    );
  }

  // ✅ Get application by ID
  getApplicationById(applicationId: number): Observable<ApplicationDto> {
    console.log('🔍 Getting application by ID:', applicationId);
    
    return this.http.get<ApplicationDto>(`${this.API_URL}/applications/${applicationId}`, {
      headers: this.getHeaders()
    }).pipe(
      catchError(error => {
        console.error('❌ Error loading application:', error);
        return throwError(() => this.handleError(error));
      })
    );
  }

  // ✅ Filter applications
  filterApplications(filters: ApplicationFilters): Observable<ApplicationDto[]> {
    console.log('🔍 Filtering applications:', filters);
    
    let params = new HttpParams();
    
    if (filters.status) {
      params = params.set('status', filters.status);
    }
    if (filters.projectId) {
      params = params.set('projectId', filters.projectId.toString());
    }
    if (filters.dateFrom) {
      params = params.set('dateFrom', filters.dateFrom);
    }
    if (filters.dateTo) {
      params = params.set('dateTo', filters.dateTo);
    }
    if (filters.search) {
      params = params.set('search', filters.search);
    }

    return this.http.get<ApplicationDto[]>(`${this.API_URL}/applications/filter`, {
      headers: this.getHeaders(),
      params
    }).pipe(
      catchError(error => {
        console.error('❌ Error filtering applications:', error);
        return throwError(() => this.handleError(error));
      })
    );
  }

  // ✅ Get application statistics
  getApplicationStats(): Observable<ApplicationSummary> {
    const currentUser = this.getCurrentUsername();
    console.log('📊 Getting application statistics for user:', currentUser);
    
    return this.http.get<ApplicationSummary>(`${this.API_URL}/applications/stats`, {
      headers: this.getHeaders()
    }).pipe(
      catchError(error => {
        console.error('❌ Error loading application stats:', error);
        return throwError(() => this.handleError(error));
      })
    );
  }

  // ✅ Check if user can apply to project
  canApplyToProject(projectId: number): Observable<boolean> {
    console.log('🔍 Checking if user can apply to project:', projectId);
    
    return this.http.get<{ canApply: boolean }>(`${this.API_URL}/projects/${projectId}/can-apply`, {
      headers: this.getHeaders()
    }).pipe(
      map(response => response.canApply),
      catchError(error => {
        console.error('❌ Error checking application eligibility:', error);
        return throwError(() => this.handleError(error));
      })
    );
  }

  // ✅ Get attachment file paths as array
  getAttachmentPaths(application: ApplicationDto): string[] {
    if (!application.attachmentPaths) {
      return [];
    }
    try {
      return JSON.parse(application.attachmentPaths);
    } catch (error) {
      console.warn('⚠️ Failed to parse attachment paths:', application.attachmentPaths);
      return application.attachmentPaths.split(',').filter(path => path.trim().length > 0);
    }
  }

  // ✅ Get selected portfolio items as array
  getSelectedPortfolioItems(application: ApplicationDto): string[] {
    if (!application.selectedPortfolioItems) {
      return [];
    }
    return application.selectedPortfolioItems.split(',').filter(item => item.trim().length > 0);
  }

  // ✅ Format application status for display
  getStatusLabel(status: ApplicationStatus): string {
    const statusLabels: Record<ApplicationStatus, string> = {
      [ApplicationStatus.PENDING]: 'Pending Review',
      [ApplicationStatus.UNDER_REVIEW]: 'Under Review',
      [ApplicationStatus.SHORTLISTED]: 'Shortlisted',
      [ApplicationStatus.ACCEPTED]: 'Accepted',
      [ApplicationStatus.REJECTED]: 'Rejected',
      [ApplicationStatus.WITHDRAWN]: 'Withdrawn',
      [ApplicationStatus.INTERVIEW_REQUESTED]: 'Interview Requested',
      [ApplicationStatus.OFFER_SENT]: 'Offer Sent'
    };
    return statusLabels[status] || status;
  }

  // ✅ Get status color for UI
  getStatusColor(status: ApplicationStatus): string {
    const statusColors: Record<ApplicationStatus, string> = {
      [ApplicationStatus.PENDING]: 'bg-yellow-100 text-yellow-800',
      [ApplicationStatus.UNDER_REVIEW]: 'bg-blue-100 text-blue-800',
      [ApplicationStatus.SHORTLISTED]: 'bg-purple-100 text-purple-800',
      [ApplicationStatus.ACCEPTED]: 'bg-green-100 text-green-800',
      [ApplicationStatus.REJECTED]: 'bg-red-100 text-red-800',
      [ApplicationStatus.WITHDRAWN]: 'bg-gray-100 text-gray-800',
      [ApplicationStatus.INTERVIEW_REQUESTED]: 'bg-indigo-100 text-indigo-800',
      [ApplicationStatus.OFFER_SENT]: 'bg-emerald-100 text-emerald-800'
    };
    return statusColors[status] || 'bg-gray-100 text-gray-800';
  }

  // ✅ Check if application is in final state
  isFinalStatus(status: ApplicationStatus): boolean {
    return [
      ApplicationStatus.ACCEPTED,
      ApplicationStatus.REJECTED,
      ApplicationStatus.WITHDRAWN
    ].includes(status);
  }

  // ✅ Check if application can be withdrawn
  canWithdraw(status: ApplicationStatus): boolean {
    return [
      ApplicationStatus.PENDING,
      ApplicationStatus.UNDER_REVIEW,
      ApplicationStatus.SHORTLISTED
    ].includes(status);
  }

  // ✅ Format budget display
  formatBudget(budget: number, currency: string = 'EUR'): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(budget);
  }

  // ✅ Format date for display
  formatDate(dateString: string): string {
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

  // ✅ Get relative time (e.g., "2 days ago")
  getRelativeTime(dateString: string): string {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      
      if (diffDays === 0) return 'Today';
      if (diffDays === 1) return 'Yesterday';
      if (diffDays < 7) return `${diffDays} days ago`;
      if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
      if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
      return `${Math.floor(diffDays / 365)} years ago`;
    } catch (error) {
      console.warn('⚠️ Invalid date format:', dateString);
      return 'Unknown';
    }
  }

  // ✅ Refresh applications data
  refreshMyApplications(): void {
    this.getMyApplications().subscribe();
  }

  refreshClientApplications(): void {
    this.getApplicationsForMyProjects().subscribe();
  }

  refreshProjectApplications(projectId: number): void {
    this.getApplicationsForProject(projectId).subscribe();
  }

  // ✅ Clear cached data
  clearCache(): void {
    this.applicationsSubject.next([]);
    this.myApplicationsSubject.next([]);
    this.clientApplicationsSubject.next([]);
  }

  // ✅ Authentication and token methods
  isAuthenticated(): boolean {
    const token = this.getToken();
    return !!token && !this.isTokenExpired(token);
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  setToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
    const username = this.getCurrentUsername();
    console.log('✅ Token saved for user:', username);
  }

  clearToken(): void {
    const username = this.getCurrentUsername();
    localStorage.removeItem(this.TOKEN_KEY);
    console.log('🗑️ Token cleared for user:', username);
  }

  // ✅ Get current username from JWT token
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

  // ✅ Get current user info from JWT token
  getCurrentUserInfo(): { username: string; exp: number; iat: number } | null {
    const token = this.getToken();
    if (!token) {
      return null;
    }

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return {
        username: payload.sub || payload.username,
        exp: payload.exp,
        iat: payload.iat
      };
    } catch (error) {
      console.warn('⚠️ Could not parse user info from token');
      return null;
    }
  }

  // ✅ Check if token is expired
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

  // ✅ Private helper methods
  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem(this.TOKEN_KEY);
    const currentUser = this.getCurrentUsername();
    
    // ✅ Enhanced debug logging with dynamic user
    console.log('🔑 ApplicationService: Getting headers for user:', currentUser);
    console.log('🔑 Token key used:', this.TOKEN_KEY);
    console.log('🔑 Token found:', token ? 'Yes' : 'No');
    
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        console.log('👤 Token username:', payload.sub);
        console.log('⏰ Token expires:', new Date(payload.exp * 1000));
        console.log('🕐 Current time:', new Date());
        console.log('✅ Token valid:', payload.exp > Math.floor(Date.now() / 1000));
      } catch (e) {
        console.warn('⚠️ Could not parse token payload');
      }
    } else {
      console.error('❌ No token found in localStorage with key:', this.TOKEN_KEY);
      console.log('🔍 Available localStorage keys:', Object.keys(localStorage));
    }
    
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    });
  }

  private setLoading(loading: boolean): void {
    this.loadingSubject.next(loading);
  }

  private handleError(error: any): string {
    const currentUser = this.getCurrentUsername();
    console.error('🚨 ApplicationService Error Details for user:', currentUser);
    console.error('🚨 Error:', error);
    
    if (error.status === 401) {
      console.error('❌ Unauthorized - Token may be invalid or expired');
      this.clearToken();
      return 'Your session has expired. Please log in again.';
    }
    
    if (error.status === 403) {
      console.error('❌ Forbidden - User may not be authenticated properly');
      return 'You do not have permission to perform this action.';
    }
    
    if (error.status === 404) {
      return 'The requested resource was not found.';
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

  // ✅ Get current applications count
  get currentApplicationsCount(): number {
    return this.applicationsSubject.value.length;
  }

  get currentMyApplicationsCount(): number {
    return this.myApplicationsSubject.value.length;
  }

  get currentClientApplicationsCount(): number {
    return this.clientApplicationsSubject.value.length;
  }

  get isLoading(): boolean {
    return this.loadingSubject.value;
  }

  // ✅ Utility method to validate application request
  validateApplicationRequest(request: ApplicationRequest): string[] {
    const errors: string[] = [];

    if (!request.coverLetter || request.coverLetter.trim().length < 50) {
      errors.push('Cover letter must be at least 50 characters long');
    }

    if (!request.proposedBudget || request.proposedBudget <= 0) {
      errors.push('Proposed budget must be greater than 0');
    }

    if (!request.proposedTimeline || request.proposedTimeline.trim().length === 0) {
      errors.push('Proposed timeline is required');
    }

    if (request.hourlyRate && request.hourlyRate <= 0) {
      errors.push('Hourly rate must be greater than 0');
    }

    return errors;
  }
}