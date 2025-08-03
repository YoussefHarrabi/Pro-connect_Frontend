import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { FormsModule } from '@angular/forms';

interface FileAttachment {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  uploadedBy: string;
  uploadedAt: Date;
}

@Component({
  selector: 'app-file-manager',
  standalone: true,
  imports: [CommonModule, TranslateModule, FormsModule],
  templateUrl: './file-manager.html',
  styleUrls: ['./file-manager.scss']
})
export class FileManagerComponent {
  @Input() files: FileAttachment[] = [];
  @Input() currentUserRole: 'client' | 'freelancer' = 'client';
  @Output() fileUploaded = new EventEmitter<Omit<FileAttachment, 'id' | 'uploadedAt'>>();
  @Output() fileDeleted = new EventEmitter<string>();

  viewMode: 'grid' | 'list' = 'grid';
  sortBy: 'name' | 'date' | 'size' | 'type' = 'date';
  sortOrder: 'asc' | 'desc' = 'desc';
  filterType: 'all' | 'images' | 'documents' | 'archives' = 'all';
  searchQuery = '';

  fileTypeCategories = {
    images: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
    documents: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'],
    archives: ['application/zip', 'application/x-rar-compressed', 'application/x-7z-compressed']
  };

  get filteredFiles(): FileAttachment[] {
    let filtered = [...this.files];

    // Apply search filter
    if (this.searchQuery.trim()) {
      filtered = filtered.filter(file => 
        file.name.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        file.uploadedBy.toLowerCase().includes(this.searchQuery.toLowerCase())
      );
    }

    // Apply type filter
    if (this.filterType !== 'all') {
      const allowedTypes = this.fileTypeCategories[this.filterType as keyof typeof this.fileTypeCategories];
      filtered = filtered.filter(file => allowedTypes.includes(file.type));
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (this.sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'date':
          comparison = new Date(a.uploadedAt).getTime() - new Date(b.uploadedAt).getTime();
          break;
        case 'size':
          comparison = a.size - b.size;
          break;
        case 'type':
          comparison = a.type.localeCompare(b.type);
          break;
      }

      return this.sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      Array.from(input.files).forEach(file => {
        const fileData = {
          name: file.name,
          size: file.size,
          type: file.type,
          url: URL.createObjectURL(file),
          uploadedBy: this.currentUserRole === 'client' ? 'John Smith' : 'Sarah Johnson'
        };
        this.fileUploaded.emit(fileData);
      });
      input.value = ''; // Reset input
    }
  }

  downloadFile(file: FileAttachment): void {
    // Mock download functionality
    const link = document.createElement('a');
    link.href = file.url;
    link.download = file.name;
    link.click();
  }

  deleteFile(file: FileAttachment): void {
    if (confirm(`Are you sure you want to delete "${file.name}"?`)) {
      this.fileDeleted.emit(file.id);
    }
  }

  canDeleteFile(file: FileAttachment): boolean {
    // Users can only delete their own files, or clients can delete any file
    const currentUserName = this.currentUserRole === 'client' ? 'John Smith' : 'Sarah Johnson';
    return this.currentUserRole === 'client' || file.uploadedBy === currentUserName;
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString([], { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getFileIcon(file: FileAttachment): string {
    if (file.type.startsWith('image/')) {
      return 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z';
    } else if (file.type === 'application/pdf') {
      return 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z';
    } else if (file.type.includes('zip') || file.type.includes('rar') || file.type.includes('7z')) {
      return 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10';
    } else if (file.type.includes('word') || file.type.includes('document')) {
      return 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z';
    } else {
      return 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z';
    }
  }

  getFileTypeColor(file: FileAttachment): string {
    if (file.type.startsWith('image/')) {
      return 'text-green-600 bg-green-100';
    } else if (file.type === 'application/pdf') {
      return 'text-red-600 bg-red-100';
    } else if (file.type.includes('zip') || file.type.includes('rar')) {
      return 'text-purple-600 bg-purple-100';
    } else if (file.type.includes('word') || file.type.includes('document')) {
      return 'text-blue-600 bg-blue-100';
    } else {
      return 'text-gray-600 bg-gray-100';
    }
  }

  isImageFile(file: FileAttachment): boolean {
    return file.type.startsWith('image/');
  }

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

  getTotalFileSize(): string {
    const totalBytes = this.files.reduce((sum, file) => sum + file.size, 0);
    return this.formatFileSize(totalBytes);
  }

  getFilesByType(): { [key: string]: number } {
    const counts = { images: 0, documents: 0, archives: 0, others: 0 };
    
    this.files.forEach(file => {
      if (this.fileTypeCategories.images.includes(file.type)) {
        counts.images++;
      } else if (this.fileTypeCategories.documents.includes(file.type)) {
        counts.documents++;
      } else if (this.fileTypeCategories.archives.includes(file.type)) {
        counts.archives++;
      } else {
        counts.others++;
      }
    });

    return counts;
  }
}
