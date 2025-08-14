import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { UserProfileResponse, ProfileUpdateRequest, ResumeUpdateRequest, EducationDto, EducationRequest, CertificationDto, CertificationRequest, ExperienceDto, ExperienceRequest, PortfolioDto, SkillDto } from '../models/user';
import { PortfolioRequest } from '../../core/dto';
import { User } from '../../core/dto/user';

// Admin-specific interfaces
export interface AdminUserListResponse {
  content: User[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export interface UserStatusUpdateRequest {
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
}

export interface UserSearchCriteria {
  searchTerm?: string;
  role?: string;
  status?: string;
  page?: number;
  size?: number;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = 'http://localhost:8081/api/users';
  private readonly TOKEN_KEY = 'auth-token'; // ✅ Match AuthService

  constructor(private http: HttpClient) {}

  private getHttpOptions(): { headers: HttpHeaders } {
    const token = localStorage.getItem(this.TOKEN_KEY); // ✅ Use same key
    
    // Debug logging
    console.log('🔑 JWT Token check:', token ? 'Token exists' : 'No token found');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        console.log('👤 Token payload username:', payload.sub);
        console.log('⏰ Token expires:', new Date(payload.exp * 1000));
      } catch (e) {
        console.log('❌ Invalid token format');
      }
    }
    
    return {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
      })
    };
  }

  private handleError = (error: HttpErrorResponse): Observable<never> => {
    console.error('🚨 API Error Details:', error);
    
    if (error.status === 401) {
      console.error('❌ Unauthorized - Token may be invalid or expired');
      this.clearToken();
    } else if (error.status === 404) {
      console.error('❌ User not found - Check if the user exists in database');
    } else if (error.status === 0) {
      console.error('❌ Network error - Backend may not be running');
    }
    
    return throwError(() => error);
  };

  // ============= PROFILE ENDPOINTS =============

  getCurrentUserProfile(): Observable<UserProfileResponse> {
    console.log('📡 Fetching user profile from:', `${this.apiUrl}/profile`);
    
    return this.http.get<UserProfileResponse>(`${this.apiUrl}/profile`, this.getHttpOptions())
      .pipe(catchError(this.handleError));
  }

  updateProfile(request: ProfileUpdateRequest): Observable<UserProfileResponse> {
    return this.http.put<UserProfileResponse>(`${this.apiUrl}/profile`, request, this.getHttpOptions())
      .pipe(catchError(this.handleError));
  }

  getUserProfileByUsername(username: string): Observable<UserProfileResponse> {
    return this.http.get<UserProfileResponse>(`${this.apiUrl}/profile/${username}`, this.getHttpOptions())
      .pipe(catchError(this.handleError));
  }

  // ============= UTILITY METHODS =============

  setToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token); // ✅ Use same key
    console.log('✅ Token saved to localStorage');
  }

  isAuthenticated(): boolean {
    const token = localStorage.getItem(this.TOKEN_KEY); // ✅ Use same key
    return !!token;
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY); // ✅ Use same key
  }

  clearToken(): void {
    localStorage.removeItem(this.TOKEN_KEY); // ✅ Use same key
    console.log('🗑️ Token cleared from localStorage');
  }

  // ... Rest of your methods stay exactly the same ...
  updateResume(request: ResumeUpdateRequest): Observable<UserProfileResponse> {
    return this.http.put<UserProfileResponse>(`${this.apiUrl}/profile/resume`, request, this.getHttpOptions())
      .pipe(catchError(this.handleError));
  }

  removeResume(): Observable<UserProfileResponse> {
    return this.http.delete<UserProfileResponse>(`${this.apiUrl}/profile/resume`, this.getHttpOptions())
      .pipe(catchError(this.handleError));
  }

  getEducation(): Observable<EducationDto[]> {
    return this.http.get<EducationDto[]>(`${this.apiUrl}/education`, this.getHttpOptions())
      .pipe(catchError(this.handleError));
  }

  addEducation(request: EducationRequest): Observable<EducationDto> {
    return this.http.post<EducationDto>(`${this.apiUrl}/education`, request, this.getHttpOptions())
      .pipe(catchError(this.handleError));
  }

  updateEducation(id: number, request: EducationRequest): Observable<EducationDto> {
    return this.http.put<EducationDto>(`${this.apiUrl}/education/${id}`, request, this.getHttpOptions())
      .pipe(catchError(this.handleError));
  }

  deleteEducation(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/education/${id}`, this.getHttpOptions())
      .pipe(catchError(this.handleError));
  }

  getCertifications(): Observable<CertificationDto[]> {
    return this.http.get<CertificationDto[]>(`${this.apiUrl}/certifications`, this.getHttpOptions())
      .pipe(catchError(this.handleError));
  }

  addCertification(request: CertificationRequest): Observable<CertificationDto> {
    return this.http.post<CertificationDto>(`${this.apiUrl}/certifications`, request, this.getHttpOptions())
      .pipe(catchError(this.handleError));
  }

  updateCertification(id: number, request: CertificationRequest): Observable<CertificationDto> {
    return this.http.put<CertificationDto>(`${this.apiUrl}/certifications/${id}`, request, this.getHttpOptions())
      .pipe(catchError(this.handleError));
  }

  deleteCertification(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/certifications/${id}`, this.getHttpOptions())
      .pipe(catchError(this.handleError));
  }

  getExperience(): Observable<ExperienceDto[]> {
    return this.http.get<ExperienceDto[]>(`${this.apiUrl}/experience`, this.getHttpOptions())
      .pipe(catchError(this.handleError));
  }

  addExperience(request: ExperienceRequest): Observable<ExperienceDto> {
    return this.http.post<ExperienceDto>(`${this.apiUrl}/experience`, request, this.getHttpOptions())
      .pipe(catchError(this.handleError));
  }

  updateExperience(id: number, request: ExperienceRequest): Observable<ExperienceDto> {
    return this.http.put<ExperienceDto>(`${this.apiUrl}/experience/${id}`, request, this.getHttpOptions())
      .pipe(catchError(this.handleError));
  }

  deleteExperience(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/experience/${id}`, this.getHttpOptions())
      .pipe(catchError(this.handleError));
  }
  // Add these methods to your user.service.ts
// Update these methods in your user.service.ts

getPortfolios(): Observable<PortfolioDto[]> {
  return this.http.get<PortfolioDto[]>(`http://localhost:8081/api/portfolios/my`, this.getHttpOptions())
    .pipe(catchError(this.handleError));
}

addPortfolio(request: PortfolioRequest): Observable<PortfolioDto> {
  // Convert PortfolioRequest to PortfolioDto since your backend expects PortfolioDto
  const portfolioDto = {
    title: request.title,
    description: request.description,
    projectLink: request.projectLink || null,
    coverImageUrl: request.coverImageUrl || null,
    technologies: request.technologies || null,
    projectType: request.projectType || 'WEB_APPLICATION' // Default value
  };
  
  return this.http.post<PortfolioDto>(`http://localhost:8081/api/portfolios`, portfolioDto, this.getHttpOptions())
    .pipe(catchError(this.handleError));
}

updatePortfolio(id: number, request: PortfolioRequest): Observable<PortfolioDto> {
  // Convert PortfolioRequest to PortfolioDto since your backend expects PortfolioDto
  const portfolioDto = {
    title: request.title,
    description: request.description,
    projectLink: request.projectLink || null,
    coverImageUrl: request.coverImageUrl || null,
    technologies: request.technologies || null,
    projectType: request.projectType || 'WEB_APPLICATION'
  };
  
  return this.http.put<PortfolioDto>(`http://localhost:8081/api/portfolios/${id}`, portfolioDto, this.getHttpOptions())
    .pipe(catchError(this.handleError));
}

deletePortfolio(id: number): Observable<void> {
  return this.http.delete<void>(`http://localhost:8081/api/portfolios/${id}`, this.getHttpOptions())
    .pipe(catchError(this.handleError));
}

// Add this method to your user.service.ts after your existing portfolio methods

uploadPortfolioImage(file: File): Observable<{imagePath: string, message: string}> {
  const formData = new FormData();
  formData.append('file', file);
  
  // Create headers without Content-Type for file upload
  const token = localStorage.getItem(this.TOKEN_KEY);
  const headers = new HttpHeaders({
    'Authorization': token ? `Bearer ${token}` : ''
    // Don't set Content-Type for FormData - browser will set it automatically
  });
  
  return this.http.post<{imagePath: string, message: string}>(
    `http://localhost:8081/api/portfolios/upload-image`, 
    formData, 
    { headers }
  ).pipe(catchError(this.handleError));
}

// Add these methods to your existing UserService class

// ============= SKILLS ENDPOINTS =============

// Get all available skills
getAllSkills(): Observable<SkillDto[]> {
  return this.http.get<SkillDto[]>(`http://localhost:8081/api/skills`, this.getHttpOptions())
    .pipe(catchError(this.handleError));
}

// Get skills by category
getSkillsByCategory(category: string): Observable<SkillDto[]> {
  return this.http.get<SkillDto[]>(`http://localhost:8081/api/skills/category/${category}`, this.getHttpOptions())
    .pipe(catchError(this.handleError));
}

// Get all skill categories
getSkillCategories(): Observable<string[]> {
  return this.http.get<string[]>(`http://localhost:8081/api/skills/categories`, this.getHttpOptions())
    .pipe(catchError(this.handleError));
}

// Get current user's skills
getCurrentUserSkills(): Observable<SkillDto[]> {
  return this.http.get<SkillDto[]>(`http://localhost:8081/api/skills/my`, this.getHttpOptions())
    .pipe(catchError(this.handleError));
}

// Get skills for a specific user by username
getUserSkillsByUsername(username: string): Observable<SkillDto[]> {
  return this.http.get<SkillDto[]>(`http://localhost:8081/api/skills/user/${username}`, this.getHttpOptions())
    .pipe(catchError(this.handleError));
}

// Add skill to current user by skill ID
addSkillToCurrentUser(skillId: number): Observable<void> {
  return this.http.post<void>(`http://localhost:8081/api/skills/my/${skillId}`, {}, this.getHttpOptions())
    .pipe(catchError(this.handleError));
}

// Add skill to current user by skill name
addSkillToCurrentUserByName(skillName: string): Observable<void> {
  return this.http.post<void>(`http://localhost:8081/api/skills/my/name/${skillName}`, {}, this.getHttpOptions())
    .pipe(catchError(this.handleError));
}

// Remove skill from current user
removeSkillFromCurrentUser(skillId: number): Observable<void> {
  return this.http.delete<void>(`http://localhost:8081/api/skills/my/${skillId}`, this.getHttpOptions())
    .pipe(catchError(this.handleError));
}

// Search skills by keyword
searchSkills(keyword: string): Observable<SkillDto[]> {
  return this.http.get<SkillDto[]>(`http://localhost:8081/api/skills/search?keyword=${keyword}`, this.getHttpOptions())
    .pipe(catchError(this.handleError));
}

// ============= ADMIN ENDPOINTS =============

/**
 * Get all users with pagination and filtering (Admin only)
 */
getAllUsers(criteria: UserSearchCriteria = {}): Observable<AdminUserListResponse> {
  let params = new HttpParams();
  
  if (criteria.searchTerm) {
    params = params.set('search', criteria.searchTerm);
  }
  if (criteria.role) {
    params = params.set('role', criteria.role);
  }
  if (criteria.status) {
    params = params.set('status', criteria.status);
  }
  if (criteria.page !== undefined) {
    params = params.set('page', criteria.page.toString());
  }
  if (criteria.size !== undefined) {
    params = params.set('size', criteria.size.toString());
  }

  console.log('📡 Admin: Fetching users with criteria:', criteria);
  
  return this.http.get<AdminUserListResponse>(`${this.apiUrl}/admin/users`, {
    ...this.getHttpOptions(),
    params
  }).pipe(catchError(this.handleError));
}

/**
 * Get user by ID (Admin only)
 */
getUserById(userId: number): Observable<User> {
  console.log('📡 Admin: Fetching user by ID:', userId);
  
  return this.http.get<User>(`${this.apiUrl}/admin/users/${userId}`, this.getHttpOptions())
    .pipe(catchError(this.handleError));
}

/**
 * Update user status (Admin only)
 */
updateUserStatus(userId: number, status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'): Observable<User> {
  const request: UserStatusUpdateRequest = { status };
  
  console.log('📡 Admin: Updating user status:', { userId, status });
  
  return this.http.put<User>(`${this.apiUrl}/admin/users/${userId}/status`, request, this.getHttpOptions())
    .pipe(catchError(this.handleError));
}

/**
 * Delete user (Admin only)
 */
deleteUser(userId: number): Observable<void> {
  console.log('📡 Admin: Deleting user:', userId);
  
  return this.http.delete<void>(`${this.apiUrl}/admin/users/${userId}`, this.getHttpOptions())
    .pipe(catchError(this.handleError));
}

/**
 * Get user statistics (Admin only)
 */
getUserStatistics(): Observable<{
  totalUsers: number;
  activeUsers: number;
  newUsersThisMonth: number;
  usersByRole: Record<string, number>;
}> {
  console.log('📡 Admin: Fetching user statistics');
  
  return this.http.get<{
    totalUsers: number;
    activeUsers: number;
    newUsersThisMonth: number;
    usersByRole: Record<string, number>;
  }>(`${this.apiUrl}/admin/statistics`, this.getHttpOptions())
    .pipe(catchError(this.handleError));
}
// ============= PROFILE PICTURE ENDPOINTS =============

uploadProfilePicture(file: File): Observable<{imagePath: string, message: string}> {
  const formData = new FormData();
  formData.append('file', file);
  
  // Create headers without Content-Type for file upload
  const token = localStorage.getItem(this.TOKEN_KEY);
  const headers = new HttpHeaders({
    'Authorization': token ? `Bearer ${token}` : ''
    // Don't set Content-Type for FormData - browser will set it automatically
  });
  
  return this.http.post<{imagePath: string, message: string}>(
    `${this.apiUrl}/profile/upload-picture`, 
    formData, 
    { headers }
  ).pipe(catchError(this.handleError));
}

// Helper method to get profile picture URL
getProfilePictureUrl(imagePath: string): string {
  if (!imagePath) return '';
  
  // If it's already a full URL, return as is
  if (imagePath.startsWith('http')) {
    return imagePath;
  }
  
  // Extract filename from path
  const fileName = imagePath.substring(imagePath.lastIndexOf('/') + 1);
  return `http://localhost:8081/api/users/profile/picture/${fileName}`;
}
}