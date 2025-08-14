// Create: src/app/shared/services/project.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

// ============= INTERFACES =============
export interface ProjectCreateRequest {
  title: string;
  description: string;
  category: ProjectCategory;
  skills: string[];
  projectType: ProjectType;
  budgetMin: number;
  budgetMax: number;
  currency?: string;
  budgetNegotiable?: boolean;
  timeline: string;
  complexity?: ComplexityLevel;
  preferredTalentType?: TalentType;
  experienceLevel?: ExperienceLevel;
  location?: string;
  isRemote?: boolean;
  isUrgent?: boolean;
  isFeatured?: boolean;
  deadline?: string; // Format: YYYY-MM-DD
}

export interface ProjectDto {
  id: number;
  title: string;
  description: string;
  category: ProjectCategory;
  skills: string[];
  projectType: ProjectType;
  budgetMin: number;
  budgetMax: number;
  currency: string;
  budgetNegotiable: boolean;
  timeline: string;
  complexity: ComplexityLevel;
  preferredTalentType: TalentType;
  experienceLevel: ExperienceLevel;
  location?: string;
  isRemote: boolean;
  isUrgent: boolean;
  isFeatured: boolean;
  deadline?: string;
  status: ProjectStatus;
  clientUsername: string;
  assignedTalentUsername?: string;
  applicationCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectStats {
  totalProjects: number;
  openProjects: number;
  inProgressProjects: number;
  completedProjects: number;
  totalApplications: number;
}

export interface ProjectTimeline {
  projectId: number;
  createdAt: string;
  status: ProjectStatus;
  deadline?: string;
}

// ============= ENUMS =============
export enum ProjectCategory {
  WEB_DEVELOPMENT = 'WEB_DEVELOPMENT',
  MOBILE_DEVELOPMENT = 'MOBILE_DEVELOPMENT',
  DESKTOP_DEVELOPMENT = 'DESKTOP_DEVELOPMENT',
  DESIGN_CREATIVE = 'DESIGN_CREATIVE',
  DATA_SCIENCE = 'DATA_SCIENCE',
  MARKETING_SALES = 'MARKETING_SALES',
  WRITING_TRANSLATION = 'WRITING_TRANSLATION',
  BUSINESS_CONSULTING = 'BUSINESS_CONSULTING',
  ENGINEERING_ARCHITECTURE = 'ENGINEERING_ARCHITECTURE',
  LEGAL = 'LEGAL',
  FINANCE_ACCOUNTING = 'FINANCE_ACCOUNTING',
  MUSIC_AUDIO = 'MUSIC_AUDIO',
  VIDEO_ANIMATION = 'VIDEO_ANIMATION',
  PHOTOGRAPHY = 'PHOTOGRAPHY',
  OTHER = 'OTHER'
}

export enum ProjectType {
  FIXED = 'FIXED',
  HOURLY = 'HOURLY'
}

export enum ProjectStatus {
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CLOSED = 'CLOSED',
  CANCELLED = 'CANCELLED'
}

export enum ComplexityLevel {
  ENTRY = 'ENTRY',
  INTERMEDIATE = 'INTERMEDIATE',
  EXPERT = 'EXPERT'
}

export enum TalentType {
  FREELANCER = 'FREELANCER',
  AGENCY = 'AGENCY',
  BOTH = 'BOTH'
}

export enum ExperienceLevel {
  ENTRY = 'ENTRY',
  INTERMEDIATE = 'INTERMEDIATE',
  EXPERT = 'EXPERT'
}

@Injectable({
  providedIn: 'root'
})
export class ProjectService {
  private apiUrl = 'http://localhost:8081/api/projects';
  private readonly TOKEN_KEY = 'auth-token'; // ✅ Match UserService

  constructor(private http: HttpClient) {}

  private getHttpOptions(): { headers: HttpHeaders } {
    const token = localStorage.getItem(this.TOKEN_KEY);
    
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
    console.error('🚨 Project API Error Details:', error);
    
    if (error.status === 401) {
      console.error('❌ Unauthorized - Token may be invalid or expired');
      this.clearToken();
    } else if (error.status === 403) {
      console.error('❌ Forbidden - You do not have permission for this action');
    } else if (error.status === 404) {
      console.error('❌ Project not found');
    } else if (error.status === 0) {
      console.error('❌ Network error - Backend may not be running');
    }
    
    return throwError(() => error);
  };

  // ============= PROJECT CRUD OPERATIONS =============

  createProject(request: ProjectCreateRequest): Observable<ProjectDto> {
    console.log('📡 Creating project:', request.title);
    
    return this.http.post<ProjectDto>(`${this.apiUrl}`, request, this.getHttpOptions())
      .pipe(catchError(this.handleError));
  }

  updateProject(projectId: number, request: ProjectCreateRequest): Observable<ProjectDto> {
    console.log('📡 Updating project:', projectId);
    
    return this.http.put<ProjectDto>(`${this.apiUrl}/${projectId}`, request, this.getHttpOptions())
      .pipe(catchError(this.handleError));
  }

  getProjectById(projectId: number): Observable<ProjectDto> {
    console.log('📡 Fetching project:', projectId);
    
    return this.http.get<ProjectDto>(`${this.apiUrl}/${projectId}`, this.getHttpOptions())
      .pipe(catchError(this.handleError));
  }

  deleteProject(projectId: number): Observable<void> {
    console.log('📡 Deleting project:', projectId);
    
    return this.http.delete<void>(`${this.apiUrl}/${projectId}`, this.getHttpOptions())
      .pipe(catchError(this.handleError));
  }

  // ============= PROJECT LISTING OPERATIONS =============

  getAllOpenProjects(): Observable<ProjectDto[]> {
    console.log('📡 Fetching all open projects');
    
    return this.http.get<ProjectDto[]>(`${this.apiUrl}`, this.getHttpOptions())
      .pipe(catchError(this.handleError));
  }

  getMyProjects(): Observable<ProjectDto[]> {
    console.log('📡 Fetching my projects');
    
    return this.http.get<ProjectDto[]>(`${this.apiUrl}/my`, this.getHttpOptions())
      .pipe(catchError(this.handleError));
  }

  getProjectsByCategory(category: ProjectCategory): Observable<ProjectDto[]> {
    console.log('📡 Fetching projects by category:', category);
    
    return this.http.get<ProjectDto[]>(`${this.apiUrl}/category/${category}`, this.getHttpOptions())
      .pipe(catchError(this.handleError));
  }

  getFeaturedProjects(): Observable<ProjectDto[]> {
    console.log('📡 Fetching featured projects');
    
    return this.http.get<ProjectDto[]>(`${this.apiUrl}/featured`, this.getHttpOptions())
      .pipe(catchError(this.handleError));
  }

  getUrgentProjects(): Observable<ProjectDto[]> {
    console.log('📡 Fetching urgent projects');
    
    return this.http.get<ProjectDto[]>(`${this.apiUrl}/urgent`, this.getHttpOptions())
      .pipe(catchError(this.handleError));
  }

  getRecommendedProjects(): Observable<ProjectDto[]> {
    console.log('📡 Fetching recommended projects');
    
    return this.http.get<ProjectDto[]>(`${this.apiUrl}/recommended`, this.getHttpOptions())
      .pipe(catchError(this.handleError));
  }

  // ============= PROJECT SEARCH & FILTERING =============

  searchProjects(filters: {
    keyword?: string;
    category?: ProjectCategory;
    minBudget?: number;
    maxBudget?: number;
    isRemote?: boolean;
    isUrgent?: boolean;
    isFeatured?: boolean;
  }): Observable<ProjectDto[]> {
    console.log('📡 Searching projects with filters:', filters);
    
    let params = new HttpParams();
    
    if (filters.keyword) {
      params = params.set('keyword', filters.keyword);
    }
    if (filters.category) {
      params = params.set('category', filters.category);
    }
    if (filters.minBudget !== undefined) {
      params = params.set('minBudget', filters.minBudget.toString());
    }
    if (filters.maxBudget !== undefined) {
      params = params.set('maxBudget', filters.maxBudget.toString());
    }
    if (filters.isRemote !== undefined) {
      params = params.set('isRemote', filters.isRemote.toString());
    }
    if (filters.isUrgent !== undefined) {
      params = params.set('isUrgent', filters.isUrgent.toString());
    }
    if (filters.isFeatured !== undefined) {
      params = params.set('isFeatured', filters.isFeatured.toString());
    }
    
    return this.http.get<ProjectDto[]>(`${this.apiUrl}/search`, { 
      ...this.getHttpOptions(), 
      params 
    }).pipe(catchError(this.handleError));
  }

  // ============= PROJECT MANAGEMENT OPERATIONS =============

  assignTalentToProject(projectId: number, talentId: number): Observable<ProjectDto> {
    console.log('📡 Assigning talent to project:', projectId, 'talent:', talentId);
    
    const request = { talentId };
    return this.http.post<ProjectDto>(`${this.apiUrl}/${projectId}/assign-talent`, request, this.getHttpOptions())
      .pipe(catchError(this.handleError));
  }

  unassignTalentFromProject(projectId: number): Observable<ProjectDto> {
    console.log('📡 Unassigning talent from project:', projectId);
    
    return this.http.post<ProjectDto>(`${this.apiUrl}/${projectId}/unassign-talent`, {}, this.getHttpOptions())
      .pipe(catchError(this.handleError));
  }

  completeProject(projectId: number): Observable<void> {
    console.log('📡 Completing project:', projectId);
    
    return this.http.post<void>(`${this.apiUrl}/${projectId}/complete`, {}, this.getHttpOptions())
      .pipe(catchError(this.handleError));
  }

  closeProject(projectId: number): Observable<ProjectDto> {
    console.log('📡 Closing project:', projectId);
    
    return this.http.post<ProjectDto>(`${this.apiUrl}/${projectId}/close`, {}, this.getHttpOptions())
      .pipe(catchError(this.handleError));
  }

  reopenProject(projectId: number): Observable<ProjectDto> {
    console.log('📡 Reopening project:', projectId);
    
    return this.http.post<ProjectDto>(`${this.apiUrl}/${projectId}/reopen`, {}, this.getHttpOptions())
      .pipe(catchError(this.handleError));
  }

  // ============= PROJECT DRAFT OPERATIONS =============

  saveProjectDraft(request: ProjectCreateRequest): Observable<ProjectDto> {
    console.log('📡 Saving project draft:', request.title);
    
    return this.http.post<ProjectDto>(`${this.apiUrl}/draft`, request, this.getHttpOptions())
      .pipe(catchError(this.handleError));
  }

  publishProject(projectId: number): Observable<ProjectDto> {
    console.log('📡 Publishing project:', projectId);
    
    return this.http.post<ProjectDto>(`${this.apiUrl}/${projectId}/publish`, {}, this.getHttpOptions())
      .pipe(catchError(this.handleError));
  }

  // ============= PROJECT STATISTICS & ANALYTICS =============

  getProjectStats(): Observable<ProjectStats> {
    console.log('📡 Fetching project statistics');
    
    return this.http.get<ProjectStats>(`${this.apiUrl}/my/stats`, this.getHttpOptions())
      .pipe(catchError(this.handleError));
  }

  getProjectApplicationsCount(projectId: number): Observable<{applicationCount: number}> {
    console.log('📡 Fetching applications count for project:', projectId);
    
    return this.http.get<{applicationCount: number}>(`${this.apiUrl}/${projectId}/applications/count`, this.getHttpOptions())
      .pipe(catchError(this.handleError));
  }

  getProjectTimeline(projectId: number): Observable<ProjectTimeline> {
    console.log('📡 Fetching project timeline:', projectId);
    
    return this.http.get<ProjectTimeline>(`${this.apiUrl}/${projectId}/timeline`, this.getHttpOptions())
      .pipe(catchError(this.handleError));
  }

  // ============= PROJECT CATEGORIES & METADATA =============

  getProjectCategories(): Observable<Array<{value: string, label: string}>> {
    console.log('📡 Fetching project categories');
    
    return this.http.get<Array<{value: string, label: string}>>(`${this.apiUrl}/categories`, this.getHttpOptions())
      .pipe(catchError(this.handleError));
  }

  // ============= UTILITY METHODS =============

  setToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
    console.log('✅ Token saved to localStorage');
  }

  isAuthenticated(): boolean {
    const token = localStorage.getItem(this.TOKEN_KEY);
    return !!token;
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  clearToken(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    console.log('🗑️ Token cleared from localStorage');
  }

  // ============= HELPER METHODS =============

  formatBudgetRange(project: ProjectDto): string {
    if (project.budgetMin === project.budgetMax) {
      return `${project.currency} ${project.budgetMin}`;
    }
    return `${project.currency} ${project.budgetMin} - ${project.budgetMax}`;
  }

  getProjectStatusLabel(status: ProjectStatus): string {
    switch (status) {
      case ProjectStatus.OPEN:
        return 'Open for Applications';
      case ProjectStatus.IN_PROGRESS:
        return 'In Progress';
      case ProjectStatus.COMPLETED:
        return 'Completed';
      case ProjectStatus.CLOSED:
        return 'Closed';
      case ProjectStatus.CANCELLED:
        return 'Cancelled';
      default:
        return status;
    }
  }

  getCategoryLabel(category: ProjectCategory): string {
    return category.replace(/_/g, ' ').toLowerCase()
      .replace(/\b\w/g, l => l.toUpperCase());
  }

  getComplexityLabel(complexity: ComplexityLevel): string {
    switch (complexity) {
      case ComplexityLevel.ENTRY:
        return 'Entry Level';
      case ComplexityLevel.INTERMEDIATE:
        return 'Intermediate';
      case ComplexityLevel.EXPERT:
        return 'Expert';
      default:
        return complexity;
    }
  }

  isProjectExpired(project: ProjectDto): boolean {
    if (!project.deadline) return false;
    return new Date(project.deadline) < new Date();
  }

  canApplyToProject(project: ProjectDto): boolean {
    return project.status === ProjectStatus.OPEN && !this.isProjectExpired(project);
  }

  getTimelineLabel(timeline: string): string {
    switch (timeline) {
      case 'less-than-1-week':
        return 'Less than 1 week';
      case '1-2-weeks':
        return '1-2 weeks';
      case '2-4-weeks':
        return '2-4 weeks';
      case '1-2-months':
        return '1-2 months';
      case '2-4-months':
        return '2-4 months';
      case 'more-than-4-months':
        return 'More than 4 months';
      default:
        return timeline;
    }
  }

  // ============= PROJECT VALIDATION HELPERS =============

  validateProject(project: ProjectCreateRequest): string[] {
    const errors: string[] = [];

    if (!project.title || project.title.trim().length < 10) {
      errors.push('Title must be at least 10 characters long');
    }

    if (!project.description || project.description.trim().length < 50) {
      errors.push('Description must be at least 50 characters long');
    }

    if (!project.category) {
      errors.push('Category is required');
    }

    if (!project.skills || project.skills.length === 0) {
      errors.push('At least one skill is required');
    }

    if (!project.projectType) {
      errors.push('Project type is required');
    }

    if (!project.budgetMin || project.budgetMin <= 0) {
      errors.push('Minimum budget must be greater than 0');
    }

    if (!project.budgetMax || project.budgetMax <= 0) {
      errors.push('Maximum budget must be greater than 0');
    }

    if (project.budgetMin && project.budgetMax && project.budgetMin > project.budgetMax) {
      errors.push('Minimum budget cannot be greater than maximum budget');
    }

    if (!project.timeline) {
      errors.push('Timeline is required');
    }

    return errors;
  }
  // ✅ Get projects assigned to current freelancer/talent
getAssignedProjects(): Observable<ProjectDto[]> {
  console.log('📡 Fetching projects assigned to current talent');
  
  return this.http.get<ProjectDto[]>(`${this.apiUrl}/assigned`, this.getHttpOptions())
    .pipe(catchError(this.handleError));
}

// ✅ Get statistics for assigned projects
getAssignedProjectStats(): Observable<any> {
  console.log('📡 Fetching assigned project statistics');
  
  return this.http.get<any>(`${this.apiUrl}/assigned/stats`, this.getHttpOptions())
    .pipe(catchError(this.handleError));
}
}