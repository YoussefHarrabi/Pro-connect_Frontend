// src/app/shared/services/file-attachment.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpEvent, HttpEventType } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

// ✅ File attachment interfaces
export interface FileAttachmentDto {
  id: number;
  fileName: string;
  storedFileName: string;
  fileType: string;
  size: number;
  uploaderUsername: string;
  downloadUrl: string;
  createdAt: string;
}

export interface FileUploadProgress {
  progress: number;
  file: File;
  status: 'uploading' | 'completed' | 'error';
}

@Injectable({
  providedIn: 'root'
})
export class FileAttachmentService {
  private API_URL = 'http://localhost:8081/api';
  private readonly TOKEN_KEY = 'auth-token';

  // ✅ State management
  private projectFilesSubject = new BehaviorSubject<FileAttachmentDto[]>([]);
  public projectFiles$ = this.projectFilesSubject.asObservable();
  
  private uploadProgressSubject = new BehaviorSubject<FileUploadProgress | null>(null);
  public uploadProgress$ = this.uploadProgressSubject.asObservable();

  constructor(private http: HttpClient) {
    const currentUser = this.getCurrentUsername();
    console.log('🚀 FileAttachmentService initialized - Current user:', currentUser || 'Not authenticated');
  }

  // ✅ Upload file to project - Updated to match controller endpoint
  uploadProjectFile(projectId: number, file: File): Observable<FileAttachmentDto> {
    const currentUser = this.getCurrentUsername();
    console.log('📁 FileAttachmentService: Uploading project file:', file.name);
    console.log('🏗️ Project ID:', projectId);
    console.log('👤 Current user ():', currentUser);
    
    const formData = new FormData();
    formData.append('file', file);

    // Reset upload progress
    this.uploadProgressSubject.next({
      progress: 0,
      file: file,
      status: 'uploading'
    });
    
    // ✅ Updated to match controller: /api/projects/{projectId}/workspace/files
    return this.http.post<FileAttachmentDto>(`${this.API_URL}/projects/${projectId}/workspace/files`, formData, {
      headers: this.getFileHeaders(),
      reportProgress: true,
      observe: 'events'
    }).pipe(
      map((event: HttpEvent<any>) => {
        switch (event.type) {
          case HttpEventType.UploadProgress:
            if (event.total) {
              const progress = Math.round(100 * event.loaded / event.total);
              this.uploadProgressSubject.next({
                progress,
                file,
                status: 'uploading'
              });
              console.log('📊 Upload progress:', progress + '%');
            }
            break;
          case HttpEventType.Response:
            console.log('✅ Project file uploaded successfully for :', event.body);
            this.uploadProgressSubject.next({
              progress: 100,
              file,
              status: 'completed'
            });
            
            // Refresh project files
            this.refreshProjectFiles(projectId);
            
            return event.body;
        }
        return null as any;
      }),
      catchError(error => {
        console.error('❌ Error uploading project file for :', error);
        this.uploadProgressSubject.next({
          progress: 0,
          file,
          status: 'error'
        });
        return throwError(() => this.handleError(error));
      })
    );
  }

  // ✅ Get project files - Updated to match controller endpoint
  getProjectFiles(projectId: number): Observable<FileAttachmentDto[]> {
    const currentUser = this.getCurrentUsername();
    console.log('📁 Getting project files for project:', projectId, 'by user :', currentUser);
    
    // ✅ Updated to match controller: /api/projects/{projectId}/workspace/files
    return this.http.get<FileAttachmentDto[]>(`${this.API_URL}/projects/${projectId}/workspace/files`, {
      headers: this.getHeaders()
    }).pipe(
      map(response => {
        console.log('✅ Project files loaded for :', response.length);
        this.projectFilesSubject.next(response);
        return response;
      }),
      catchError(error => {
        console.error('❌ Error loading project files for :', error);
        // Return empty array if endpoint doesn't exist yet
        if (error.status === 404) {
          console.log('ℹ️ Project files endpoint not implemented yet, returning empty array');
          const emptyFiles: FileAttachmentDto[] = [];
          this.projectFilesSubject.next(emptyFiles);
          return new Observable<FileAttachmentDto[]>(observer => {
            observer.next(emptyFiles);
            observer.complete();
          });
        }
        return throwError(() => this.handleError(error));
      })
    );
  }

  // ✅ Download file - Updated to match controller endpoint
  downloadFile(storedFileName: string, originalFileName: string): Observable<Blob> {
    console.log('⬇️ Downloading file for :', originalFileName, 'stored as:', storedFileName);
    
    // ✅ Updated to match controller: /api/workspace/files/{storedFileName}
    return this.http.get(`${this.API_URL}/workspace/files/${storedFileName}`, {
      headers: this.getHeaders(),
      responseType: 'blob'
    }).pipe(
      map(blob => {
        console.log('✅ File downloaded successfully for ');
        
        // Create download link
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = originalFileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
        return blob;
      }),
      catchError(error => {
        console.error('❌ Error downloading file for :', error);
        return throwError(() => this.handleError(error));
      })
    );
  }

  // ✅ Delete file - Updated to match controller endpoint
  deleteFile(fileId: number): Observable<void> {
    console.log('🗑️ Deleting file for :', fileId);
    
    // ✅ Updated to match controller: /api/workspace/files/{fileId}
    return this.http.delete<void>(`${this.API_URL}/workspace/files/${fileId}`, {
      headers: this.getHeaders()
    }).pipe(
      map(() => {
        console.log('✅ File deleted successfully for ');
        
        // Remove file from current lists
        this.removeFileFromLists(fileId);
      }),
      catchError(error => {
        console.error('❌ Error deleting file for :', error);
        return throwError(() => this.handleError(error));
      })
    );
  }

  // ✅ File utility methods
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  getFileIcon(fileType: string): string {
    if (!fileType) return '📎';
    
    const type = fileType.toLowerCase();
    
    if (type.includes('image')) return '🖼️';
    if (type.includes('pdf')) return '📄';
    if (type.includes('word') || type.includes('document')) return '📝';
    if (type.includes('excel') || type.includes('spreadsheet')) return '📊';
    if (type.includes('powerpoint') || type.includes('presentation')) return '📽️';
    if (type.includes('zip') || type.includes('rar') || type.includes('archive')) return '📦';
    if (type.includes('video')) return '🎥';
    if (type.includes('audio')) return '🎵';
    if (type.includes('text')) return '📋';
    
    return '📎';
  }

  getFileTypeCategory(fileType: string): string {
    if (!fileType) return 'Others';
    
    const type = fileType.toLowerCase();
    
    if (type.includes('image')) return 'Images';
    if (type.includes('pdf') || type.includes('document') || type.includes('text')) return 'Documents';
    if (type.includes('zip') || type.includes('rar') || type.includes('archive')) return 'Archives';
    if (type.includes('video')) return 'Videos';
    if (type.includes('audio')) return 'Audio';
    
    return 'Others';
  }

  isImageFile(fileType: string): boolean {
    return !!(fileType && fileType.toLowerCase().includes('image'));
  }

  canPreview(fileType: string): boolean {
    if (!fileType) return false;
    const type = fileType.toLowerCase();
    return type.includes('image') || type.includes('pdf') || type.includes('text');
  }

  // ✅ Validate file for 
  validateFile(file: File, maxSizeMB: number = 50): { valid: boolean; error?: string } {
    console.log('🔍 Validating file for :', file.name, 'size:', this.formatFileSize(file.size));
    
    // Check file size
    const maxBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxBytes) {
      return {
        valid: false,
        error: `File size must be less than ${maxSizeMB}MB`
      };
    }

    // Check file type (basic validation)
    const allowedTypes = [
      'image/', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats',
      'text/', 'application/zip', 'application/x-rar', 'video/', 'audio/',
      'application/vnd.ms-excel', 'application/vnd.ms-powerpoint'
    ];

    const isAllowed = allowedTypes.some(type => file.type.includes(type));
    if (!isAllowed) {
      console.log('❌ File type not allowed for :', file.type);
      return {
        valid: false,
        error: 'File type not supported. Allowed: Images, PDF, Office documents, Text files, Archives'
      };
    }

    console.log('✅ File validation passed for ');
    return { valid: true };
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
      console.warn('⚠️ Invalid date format for :', dateString);
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
      console.warn('⚠️ Invalid date format for :', dateString);
      return 'Unknown';
    }
  }

  // ✅ Refresh file lists
  refreshProjectFiles(projectId: number): void {
    this.getProjectFiles(projectId).subscribe();
  }

  // ✅ Clear cached data
  clearCache(): void {
    this.projectFilesSubject.next([]);
    this.uploadProgressSubject.next(null);
  }

  // ✅ File statistics
  getFileStatistics(files: FileAttachmentDto[]): any {
    const stats = {
      total: files.length,
      totalSize: 0,
      byType: {} as any,
      byCategory: {} as any,
      recentFiles: [] as FileAttachmentDto[]
    };

    files.forEach(file => {
      stats.totalSize += file.size;
      
      // Count by type
      const category = this.getFileTypeCategory(file.fileType);
      stats.byCategory[category] = (stats.byCategory[category] || 0) + 1;
      
      // Count by file type
      stats.byType[file.fileType] = (stats.byType[file.fileType] || 0) + 1;
    });

    // Get recent files (last 7 days)
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    stats.recentFiles = files.filter(file => {
      const fileDate = new Date(file.createdAt);
      return fileDate > weekAgo;
    }).slice(0, 5); // Latest 5 files

    return stats;
  }

  // ✅ Search and filter files
  searchFiles(files: FileAttachmentDto[], searchTerm: string): FileAttachmentDto[] {
    if (!searchTerm.trim()) return files;
    
    const term = searchTerm.toLowerCase();
    return files.filter(file => 
      file.fileName.toLowerCase().includes(term) ||
      file.fileType.toLowerCase().includes(term) ||
      file.uploaderUsername.toLowerCase().includes(term)
    );
  }

  filterFilesByType(files: FileAttachmentDto[], fileType: string): FileAttachmentDto[] {
    if (!fileType || fileType === 'all') return files;
    
    return files.filter(file => this.getFileTypeCategory(file.fileType) === fileType);
  }

  sortFiles(files: FileAttachmentDto[], sortBy: 'name' | 'date' | 'size' | 'type', ascending = true): FileAttachmentDto[] {
    const sorted = [...files].sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'name':
          comparison = a.fileName.localeCompare(b.fileName);
          break;
        case 'date':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case 'size':
          comparison = a.size - b.size;
          break;
        case 'type':
          comparison = a.fileType.localeCompare(b.fileType);
          break;
      }
      
      return ascending ? comparison : -comparison;
    });
    
    return sorted;
  }

  // ✅ Private helper methods
  private removeFileFromLists(fileId: number): void {
    // Remove from project files
    const currentProjectFiles = this.projectFilesSubject.value;
    const filteredProjectFiles = currentProjectFiles.filter(file => file.id !== fileId);
    this.projectFilesSubject.next(filteredProjectFiles);
  }

  // ✅ Authentication methods
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

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem(this.TOKEN_KEY);
    const currentUser = this.getCurrentUsername();
    
    console.log('🔑 FileAttachmentService: Getting headers for :', currentUser);
    console.log('🔑 Token found:', token ? 'Yes' : 'No');
    
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    });
  }

  private getFileHeaders(): HttpHeaders {
    const token = localStorage.getItem(this.TOKEN_KEY);
    
    return new HttpHeaders({
      'Authorization': token ? `Bearer ${token}` : ''
      // Don't set Content-Type for FormData - let browser set it with boundary
    });
  }

  private handleError(error: any): string {
    const currentUser = this.getCurrentUsername();
    console.error('🚨 FileAttachmentService Error Details for :', currentUser);
    console.error('🚨 Error:', error);
    
    if (error.status === 401) {
      console.error('❌ Unauthorized - Token may be invalid or expired for ');
      return 'Your session has expired. Please log in again.';
    }
    
    if (error.status === 403) {
      console.error('❌ Forbidden -  may not have permission');
      return 'You do not have permission to perform this action.';
    }
    
    if (error.status === 404) {
      return 'The requested resource was not found.';
    }
    
    if (error.status === 413) {
      return 'File is too large. Please choose a smaller file.';
    }
    
    if (error.status === 415) {
      return 'Unsupported file type. Please choose a different file.';
    }
    
    if (error.status === 0) {
      console.error('❌ Network error - Backend may not be running for ');
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

  // ✅ Get current state
  get currentProjectFiles(): FileAttachmentDto[] {
    return this.projectFilesSubject.value;
  }

  get currentUploadProgress(): FileUploadProgress | null {
    return this.uploadProgressSubject.value;
  }

  get isUploading(): boolean {
    const progress = this.uploadProgressSubject.value;
    return progress !== null && progress.status === 'uploading';
  }
}