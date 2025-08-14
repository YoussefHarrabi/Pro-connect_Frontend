import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { FileAttachmentDto, FileUploadProgress, FileAttachmentService } from '../../../../shared/services/file-attachment.service';


@Component({
  selector: 'app-file-manager',
  standalone: true,
  imports: [CommonModule, TranslateModule, FormsModule],
  templateUrl: './file-manager.html',
  styleUrls: ['./file-manager.scss']
})
export class FileManagerComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  @Input() projectId!: number; // ✅ Add projectId input
  @Input() currentUserRole: 'client' | 'freelancer' = 'client';
  @Input() currentUsername: string = ''; // ✅ Add current username
  
  // ✅ Real file data from service
  files: FileAttachmentDto[] = [];
  uploadProgress: FileUploadProgress | null = null;
  isLoading = false;
  
  // UI state
  viewMode: 'grid' | 'list' = 'grid';
  sortBy: 'name' | 'date' | 'size' | 'type' = 'date';
  sortOrder: 'asc' | 'desc' = 'desc';
  filterType: 'all' | 'Images' | 'Documents' | 'Archives' | 'Videos' | 'Audio' | 'Others' = 'all';
  searchQuery = '';

  constructor(private fileService: FileAttachmentService) {}

  ngOnInit(): void {
    console.log('🚀 FileManagerComponent initialized for ');
    console.log('📁 Project ID:', this.projectId);
    console.log('👤 Current user role:', this.currentUserRole);
    
    if (this.projectId) {
      this.loadProjectFiles();
    }

    // ✅ Subscribe to upload progress
    this.fileService.uploadProgress$
      .pipe(takeUntil(this.destroy$))
      .subscribe(progress => {
        this.uploadProgress = progress;
        console.log('📊 Upload progress for :', progress);
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ✅ Load files from backend
  private loadProjectFiles(): void {
    console.log('📁 Loading project files for ...');
    this.isLoading = true;

    this.fileService.getProjectFiles(this.projectId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (files) => {
          console.log('✅ Files loaded for :', files.length);
          this.files = files;
          this.isLoading = false;
        },
        error: (error) => {
          console.error('❌ Error loading files for :', error);
          this.isLoading = false;
          // Show user-friendly error
          alert('Error loading files: ' + error);
        }
      });
  }

  // ✅ Updated filteredFiles getter using service methods
  get filteredFiles(): FileAttachmentDto[] {
    let filtered = [...this.files];

    // Apply search filter using service method
    if (this.searchQuery.trim()) {
      filtered = this.fileService.searchFiles(filtered, this.searchQuery);
    }

    // Apply type filter using service method
    if (this.filterType !== 'all') {
      filtered = this.fileService.filterFilesByType(filtered, this.filterType);
    }

    // Apply sorting using service method
    const ascending = this.sortOrder === 'asc';
    filtered = this.fileService.sortFiles(filtered, this.sortBy, ascending);

    return filtered;
  }

  // ✅ Enhanced file selection with validation
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) {
      return;
    }

    console.log('📁 Files selected by :', input.files.length);

    Array.from(input.files).forEach(file => {
      // ✅ Validate file before upload
      const validation = this.fileService.validateFile(file, 50); // 50MB limit
      if (!validation.valid) {
        alert(`Error with file "${file.name}": ${validation.error}`);
        return;
      }

      console.log('📤 Uploading file for :', file.name);
      
      // ✅ Upload file using service
      this.fileService.uploadProjectFile(this.projectId, file)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (uploadedFile) => {
            if (uploadedFile) {
              console.log('✅ File uploaded successfully for :', uploadedFile.fileName);
              // File list will be automatically updated via service state
              this.loadProjectFiles(); // Refresh the list
            }
          },
          error: (error) => {
            console.error('❌ Upload failed for :', error);
            alert(`Upload failed for "${file.name}": ${error}`);
          }
        });
    });

    // Reset input
    input.value = '';
  }

  // ✅ Real download using service
  downloadFile(file: FileAttachmentDto): void {
    console.log('⬇️ Downloading file for :', file.fileName);
    
    this.fileService.downloadFile(file.storedFileName, file.fileName)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          console.log('✅ Download initiated for :', file.fileName);
        },
        error: (error) => {
          console.error('❌ Download failed for :', error);
          alert(`Download failed: ${error}`);
        }
      });
  }

  // ✅ Real delete using service
  deleteFile(file: FileAttachmentDto): void {
    const confirmMessage = `Are you sure you want to delete "${file.fileName}"?`;
    if (!confirm(confirmMessage)) {
      return;
    }

    console.log('🗑️ Deleting file for :', file.fileName);

    this.fileService.deleteFile(file.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          console.log('✅ File deleted successfully for :', file.fileName);
          // Remove from local array
          this.files = this.files.filter(f => f.id !== file.id);
        },
        error: (error) => {
          console.error('❌ Delete failed for :', error);
          alert(`Delete failed: ${error}`);
        }
      });
  }

  // ✅ Enhanced permission check
  canDeleteFile(file: FileAttachmentDto): boolean {
    // Clients can delete any file, users can only delete their own files
    return this.currentUserRole === 'client' || 
           file.uploaderUsername === this.currentUsername;
  }

  // ✅ Use service utility methods
  formatFileSize(bytes: number): string {
    return this.fileService.formatFileSize(bytes);
  }

  formatDate(dateString: string): string {
    return this.fileService.formatDate(dateString);
  }

  getRelativeTime(dateString: string): string {
    return this.fileService.getRelativeTime(dateString);
  }

  getFileIcon(file: FileAttachmentDto): string {
    // Convert service emoji to SVG path
    const icon = this.fileService.getFileIcon(file.fileType);
    
    // Map emojis to SVG paths for UI
    switch (icon) {
      case '🖼️': // Images
        return 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z';
      case '📄': // PDF
        return 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z';
      case '📦': // Archives
        return 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10';
      case '🎥': // Videos
        return 'M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z';
      case '🎵': // Audio
        return 'M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3';
      default:
        return 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z';
    }
  }

  getFileTypeColor(file: FileAttachmentDto): string {
    const category = this.fileService.getFileTypeCategory(file.fileType);
    
    switch (category) {
      case 'Images':
        return 'text-green-600 bg-green-100';
      case 'Documents':
        return 'text-blue-600 bg-blue-100';
      case 'Archives':
        return 'text-purple-600 bg-purple-100';
      case 'Videos':
        return 'text-red-600 bg-red-100';
      case 'Audio':
        return 'text-yellow-600 bg-yellow-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  }

  isImageFile(file: FileAttachmentDto): boolean {
    return this.fileService.isImageFile(file.fileType);
  }

  canPreviewFile(file: FileAttachmentDto): boolean {
    return this.fileService.canPreview(file.fileType);
  }

  // ✅ UI control methods
  setSortBy(field: 'name' | 'date' | 'size' | 'type'): void {
    if (this.sortBy === field) {
      this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortBy = field;
      this.sortOrder = 'asc';
    }
  }

  getSortIcon(field: string): string {
    if (this.sortBy !== field) {
      return 'M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4';
    }
    return this.sortOrder === 'asc' 
      ? 'M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12'
      : 'M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4';
  }

  // ✅ Enhanced statistics using service
  getTotalFileSize(): string {
    const stats = this.fileService.getFileStatistics(this.files);
    return this.fileService.formatFileSize(stats.totalSize);
  }

  getFilesByType(): { [key: string]: number } {
    const stats = this.fileService.getFileStatistics(this.files);
    return stats.byCategory;
  }

  // ✅ Get upload progress percentage
  getUploadProgress(): number {
    return this.uploadProgress?.progress || 0;
  }

  // ✅ Check if currently uploading
  get isUploading(): boolean {
    return this.fileService.isUploading;
  }

  // ✅ Get upload status message
  getUploadStatusMessage(): string {
    if (!this.uploadProgress) return '';
    
    const { file, progress, status } = this.uploadProgress;
    
    switch (status) {
      case 'uploading':
        return `Uploading ${file.name}... ${progress}%`;
      case 'completed':
        return `${file.name} uploaded successfully!`;
      case 'error':
        return `Failed to upload ${file.name}`;
      default:
        return '';
    }
  }

  // ✅ Get filtered file types for dropdown
  getAvailableFileTypes(): string[] {
    const categories = new Set(this.files.map(file => 
      this.fileService.getFileTypeCategory(file.fileType)
    ));
    return ['all', ...Array.from(categories)];
  }

  // ✅ Refresh files manually
  refreshFiles(): void {
    console.log('🔄 Refreshing files for ...');
    this.loadProjectFiles();
  }

  // ✅ Clear search
  clearSearch(): void {
    this.searchQuery = '';
  }

  // ✅ Reset all filters
  resetFilters(): void {
    this.searchQuery = '';
    this.filterType = 'all';
    this.sortBy = 'date';
    this.sortOrder = 'desc';
  }
}