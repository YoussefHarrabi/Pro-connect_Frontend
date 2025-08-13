// src/app/shared/services/offer.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

// ✅ Offer interfaces
export interface OfferDto {
  offerId: number;
  applicationId: number;
  projectId: number;
  projectTitle: string;
  clientUsername: string;
  applicantUsername: string;
  title: string;
  description: string;
  budgetAmount: number;
  budgetType: BudgetType;
  timeline: string;
  startDate?: string;
  terms: string;
  details?: string;
  status: OfferStatus;
  createdAt: string;
  updatedAt?: string;
}

export interface OfferCreateRequest {
  title: string;
  description: string;
  budgetAmount: number;
  budgetType: BudgetType;
  timeline: string;
  startDate?: string;
  terms: string;
  details?: string;
}

export interface OfferResponse {
  success: boolean;
  message: string;
  offer?: OfferDto;
}

export enum BudgetType {
  FIXED = 'FIXED',
  HOURLY = 'HOURLY'
}

export enum OfferStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  EXPIRED = 'EXPIRED',
  CANCELLED = 'CANCELLED'
}

@Injectable({
  providedIn: 'root'
})
export class OfferService {
  private API_URL = 'http://localhost:8081/api';
  private readonly TOKEN_KEY = 'auth-token';

  // ✅ State management
  private sentOffersSubject = new BehaviorSubject<OfferDto[]>([]);
  public sentOffers$ = this.sentOffersSubject.asObservable();
  
  private receivedOffersSubject = new BehaviorSubject<OfferDto[]>([]);
  public receivedOffers$ = this.receivedOffersSubject.asObservable();
  
  private loadingSubject = new BehaviorSubject<boolean>(false);
  public loading$ = this.loadingSubject.asObservable();

  constructor(private http: HttpClient) {
    const currentUser = this.getCurrentUsername();
    console.log('🚀 OfferService initialized - Current user:', currentUser || 'Not authenticated');
  }

  // ✅ Create offer for an application
  createOffer(applicationId: number, offerData: OfferCreateRequest): Observable<OfferDto> {
    const currentUser = this.getCurrentUsername();
    console.log('📤 OfferService: Creating offer for application:', applicationId);
    console.log('📋 Offer data:', offerData);
    console.log('👤 Current user:', currentUser);
    
    this.setLoading(true);
    
    return this.http.post<OfferDto>(`${this.API_URL}/applications/${applicationId}/offer`, offerData, {
      headers: this.getHeaders()
    }).pipe(
      map(response => {
        console.log('✅ Offer created successfully:', response);
        this.setLoading(false);
        
        // Update sent offers list
        this.refreshSentOffers();
        
        return response;
      }),
      catchError(error => {
        console.error('❌ Error creating offer:', error);
        console.error('❌ Error status:', error.status);
        console.error('❌ Error message:', error.message);
        this.setLoading(false);
        return throwError(() => this.handleError(error));
      })
    );
  }

  // ✅ Respond to an offer (accept/reject)
  respondToOffer(offerId: number, accepted: boolean): Observable<OfferDto> {
    const currentUser = this.getCurrentUsername();
    console.log('📝 OfferService: Responding to offer:', offerId, 'accepted:', accepted);
    console.log('👤 Current user:', currentUser);
    
    this.setLoading(true);
    
    return this.http.post<OfferDto>(`${this.API_URL}/offers/${offerId}/respond`, 
      { accepted }, 
      { headers: this.getHeaders() }
    ).pipe(
      map(response => {
        console.log('✅ Offer response recorded successfully:', response);
        this.setLoading(false);
        
        // Update received offers list
        this.refreshReceivedOffers();
        
        return response;
      }),
      catchError(error => {
        console.error('❌ Error responding to offer:', error);
        this.setLoading(false);
        return throwError(() => this.handleError(error));
      })
    );
  }

  // ✅ Get offers sent by client
  getSentOffers(): Observable<OfferDto[]> {
    const currentUser = this.getCurrentUsername();
    console.log('📋 Getting sent offers for client:', currentUser);
    
    this.setLoading(true);
    
    return this.http.get<OfferDto[]>(`${this.API_URL}/offers/my-sent`, {
      headers: this.getHeaders()
    }).pipe(
      map(response => {
        console.log('✅ Sent offers loaded:', response.length);
        this.sentOffersSubject.next(response);
        this.setLoading(false);
        return response;
      }),
      catchError(error => {
        console.error('❌ Error loading sent offers:', error);
        this.setLoading(false);
        return throwError(() => this.handleError(error));
      })
    );
  }

  // ✅ Get offers received by talent
  getReceivedOffers(): Observable<OfferDto[]> {
    const currentUser = this.getCurrentUsername();
    console.log('📋 Getting received offers for talent:', currentUser);
    
    this.setLoading(true);
    
    return this.http.get<OfferDto[]>(`${this.API_URL}/offers/my-received`, {
      headers: this.getHeaders()
    }).pipe(
      map(response => {
        console.log('✅ Received offers loaded:', response.length);
        this.receivedOffersSubject.next(response);
        this.setLoading(false);
        return response;
      }),
      catchError(error => {
        console.error('❌ Error loading received offers:', error);
        this.setLoading(false);
        return throwError(() => this.handleError(error));
      })
    );
  }

  // ✅ Get offer by ID
  getOfferById(offerId: number): Observable<OfferDto> {
    console.log('🔍 Getting offer by ID:', offerId);
    
    return this.http.get<OfferDto>(`${this.API_URL}/offers/${offerId}`, {
      headers: this.getHeaders()
    }).pipe(
      catchError(error => {
        console.error('❌ Error loading offer:', error);
        return throwError(() => this.handleError(error));
      })
    );
  }

  // ✅ Cancel offer (by client)
  cancelOffer(offerId: number): Observable<void> {
    console.log('🗑️ Cancelling offer:', offerId);
    
    this.setLoading(true);
    
    return this.http.delete<void>(`${this.API_URL}/offers/${offerId}`, {
      headers: this.getHeaders()
    }).pipe(
      map(() => {
        console.log('✅ Offer cancelled successfully');
        this.setLoading(false);
        
        // Update sent offers list
        this.refreshSentOffers();
      }),
      catchError(error => {
        console.error('❌ Error cancelling offer:', error);
        this.setLoading(false);
        return throwError(() => this.handleError(error));
      })
    );
  }

  // ✅ Format budget display
  formatBudget(amount: number, budgetType: BudgetType, currency: string = 'EUR'): string {
    const formattedAmount = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);

    return budgetType === BudgetType.HOURLY ? `${formattedAmount}/hr` : formattedAmount;
  }

  // ✅ Format offer status for display
  getStatusLabel(status: OfferStatus): string {
    const statusLabels: Record<OfferStatus, string> = {
      [OfferStatus.PENDING]: 'Pending Response',
      [OfferStatus.ACCEPTED]: 'Accepted',
      [OfferStatus.REJECTED]: 'Rejected',
      [OfferStatus.EXPIRED]: 'Expired',
      [OfferStatus.CANCELLED]: 'Cancelled'
    };
    return statusLabels[status] || status;
  }

  // ✅ Get status color for UI
  getStatusColor(status: OfferStatus): string {
    const statusColors: Record<OfferStatus, string> = {
      [OfferStatus.PENDING]: 'bg-yellow-100 text-yellow-800',
      [OfferStatus.ACCEPTED]: 'bg-green-100 text-green-800',
      [OfferStatus.REJECTED]: 'bg-red-100 text-red-800',
      [OfferStatus.EXPIRED]: 'bg-gray-100 text-gray-800',
      [OfferStatus.CANCELLED]: 'bg-gray-100 text-gray-800'
    };
    return statusColors[status] || 'bg-gray-100 text-gray-800';
  }

  // ✅ Check if offer is in final state
  isFinalStatus(status: OfferStatus): boolean {
    return [
      OfferStatus.ACCEPTED,
      OfferStatus.REJECTED,
      OfferStatus.EXPIRED,
      OfferStatus.CANCELLED
    ].includes(status);
  }

  // ✅ Check if offer can be cancelled
  canCancel(status: OfferStatus): boolean {
    return status === OfferStatus.PENDING;
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

  // ✅ Refresh offers data
  refreshSentOffers(): void {
    this.getSentOffers().subscribe();
  }

  refreshReceivedOffers(): void {
    this.getReceivedOffers().subscribe();
  }

  // ✅ Clear cached data
  clearCache(): void {
    this.sentOffersSubject.next([]);
    this.receivedOffersSubject.next([]);
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
    
    console.log('🔑 OfferService: Getting headers for user:', currentUser);
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
    console.error('🚨 OfferService Error Details for user:', currentUser);
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

  // ✅ Get current offers count
  get currentSentOffersCount(): number {
    return this.sentOffersSubject.value.length;
  }

  get currentReceivedOffersCount(): number {
    return this.receivedOffersSubject.value.length;
  }

  get isLoading(): boolean {
    return this.loadingSubject.value;
  }

  // ✅ Utility method to validate offer request
  validateOfferRequest(request: OfferCreateRequest): string[] {
    const errors: string[] = [];

    if (!request.title || request.title.trim().length < 5) {
      errors.push('Offer title must be at least 5 characters long');
    }

    if (!request.description || request.description.trim().length < 20) {
      errors.push('Description must be at least 20 characters long');
    }

    if (!request.budgetAmount || request.budgetAmount <= 0) {
      errors.push('Budget amount must be greater than 0');
    }

    if (!request.timeline || request.timeline.trim().length === 0) {
      errors.push('Timeline is required');
    }

    if (!request.terms || request.terms.trim().length < 50) {
      errors.push('Terms & conditions must be at least 50 characters long');
    }

    return errors;
  }
}