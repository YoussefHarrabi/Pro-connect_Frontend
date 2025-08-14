// src/app/shared/services/task.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

// ✅ Updated Task interfaces with all fields
export interface TaskDto {
  id: number;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string; // Format: "yyyy-MM-dd"
  estimatedHours: number;
  actualHours: number;
  notes: string;
  projectId: number;
  assigneeUsername?: string;
  assigneeDisplayName?: string;
  createdByUsername: string;
  createdByDisplayName: string;
  isOverdue: boolean;
  isCompleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TaskCreateRequest {
  title: string;
  description?: string;
  priority?: TaskPriority;
  dueDate?: string; // Format: "yyyy-MM-dd"
  estimatedHours?: number;
  notes?: string;
  assigneeUsername?: string;
}

export interface TaskStatusUpdateRequest {
  status: TaskStatus;
}

export interface TaskHistoryDto {
  id: number;
  action: TaskHistoryAction;
  oldValue?: string;
  newValue?: string;
  details: string;
  modifiedByUsername: string;
  timestamp: string;
}

export enum TaskStatus {
  TO_DO = 'TO_DO',
  IN_PROGRESS = 'IN_PROGRESS',
  IN_REVIEW = 'IN_REVIEW',
  DONE = 'DONE'
}

export enum TaskPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT'
}

export enum TaskHistoryAction {
  TASK_CREATED = 'TASK_CREATED',
  STATUS_UPDATED = 'STATUS_UPDATED',
  TITLE_UPDATED = 'TITLE_UPDATED',
  DESCRIPTION_UPDATED = 'DESCRIPTION_UPDATED',
  ASSIGNEE_UPDATED = 'ASSIGNEE_UPDATED',
  ATTACHMENT_ADDED = 'ATTACHMENT_ADDED'
}

@Injectable({
  providedIn: 'root'
})
export class TaskService {
  private API_URL = 'http://localhost:8081/api/tasks';
  private readonly TOKEN_KEY = 'auth-token';

  // ✅ State management
  private tasksSubject = new BehaviorSubject<TaskDto[]>([]);
  public tasks$ = this.tasksSubject.asObservable();
  
  private loadingSubject = new BehaviorSubject<boolean>(false);
  public loading$ = this.loadingSubject.asObservable();

  constructor(private http: HttpClient) {
    const currentUser = this.getCurrentUsername();
    console.log('🚀 TaskService initialized - Current user:', currentUser || 'Not authenticated');
  }

  // ✅ Create task with all fields
  createTask(projectId: number, taskData: TaskCreateRequest): Observable<TaskDto> {
    const currentUser = this.getCurrentUsername();
    console.log('📝 TaskService: Creating task for project:', projectId);
    console.log('📋 Task data:', taskData);
    console.log('👤 Current user:', currentUser);
    
    this.setLoading(true);
    
    return this.http.post<TaskDto>(`${this.API_URL}/projects/${projectId}`, taskData, {
      headers: this.getHeaders()
    }).pipe(
      map(response => {
        console.log('✅ Task created successfully:', response);
        this.setLoading(false);
        
        // Update tasks list
        this.refreshProjectTasks(projectId);
        
        return response;
      }),
      catchError(error => {
        console.error('❌ Error creating task:', error);
        this.setLoading(false);
        return throwError(() => this.handleError(error));
      })
    );
  }

  // ✅ Get tasks for project
  getProjectTasks(projectId: number): Observable<TaskDto[]> {
    const currentUser = this.getCurrentUsername();
    console.log('📋 Getting tasks for project:', projectId, 'by user:', currentUser);
    
    this.setLoading(true);
    
    return this.http.get<TaskDto[]>(`${this.API_URL}/projects/${projectId}`, {
      headers: this.getHeaders()
    }).pipe(
      map(response => {
        console.log('✅ Project tasks loaded:', response.length);
        this.tasksSubject.next(response);
        this.setLoading(false);
        return response;
      }),
      catchError(error => {
        console.error('❌ Error loading project tasks:', error);
        this.setLoading(false);
        return throwError(() => this.handleError(error));
      })
    );
  }

  // ✅ Get task by ID
  getTaskById(taskId: number): Observable<TaskDto> {
    console.log('🔍 Getting task by ID:', taskId);
    
    return this.http.get<TaskDto>(`${this.API_URL}/${taskId}`, {
      headers: this.getHeaders()
    }).pipe(
      catchError(error => {
        console.error('❌ Error loading task:', error);
        return throwError(() => this.handleError(error));
      })
    );
  }

  // ✅ Update task status
  updateTaskStatus(taskId: number, status: TaskStatus): Observable<TaskDto> {
    const currentUser = this.getCurrentUsername();
    console.log('🔄 TaskService: Updating task status:', taskId, 'to:', status);
    console.log('👤 Current user:', currentUser);
    
    this.setLoading(true);
    
    const request: TaskStatusUpdateRequest = { status };
    
    return this.http.patch<TaskDto>(`${this.API_URL}/${taskId}/status`, request, {
      headers: this.getHeaders()
    }).pipe(
      map(response => {
        console.log('✅ Task status updated successfully:', response);
        this.setLoading(false);
        
        // Update task in current list
        this.updateTaskInList(response);
        
        return response;
      }),
      catchError(error => {
        console.error('❌ Error updating task status:', error);
        this.setLoading(false);
        return throwError(() => this.handleError(error));
      })
    );
  }

  // ✅ Delete task
  deleteTask(taskId: number): Observable<void> {
    console.log('🗑️ Deleting task:', taskId);
    
    this.setLoading(true);
    
    return this.http.delete<void>(`${this.API_URL}/${taskId}`, {
      headers: this.getHeaders()
    }).pipe(
      map(() => {
        console.log('✅ Task deleted successfully');
        this.setLoading(false);
        
        // Remove task from current list
        this.removeTaskFromList(taskId);
      }),
      catchError(error => {
        console.error('❌ Error deleting task:', error);
        this.setLoading(false);
        return throwError(() => this.handleError(error));
      })
    );
  }

  // ✅ Get task history
  getTaskHistory(taskId: number): Observable<TaskHistoryDto[]> {
    console.log('📜 Getting task history for:', taskId);
    
    return this.http.get<TaskHistoryDto[]>(`${this.API_URL}/${taskId}/history`, {
      headers: this.getHeaders()
    }).pipe(
      catchError(error => {
        console.error('❌ Error loading task history:', error);
        return throwError(() => this.handleError(error));
      })
    );
  }

  // ✅ Helper methods for task status
  getStatusLabel(status: TaskStatus): string {
    const statusLabels: Record<TaskStatus, string> = {
      [TaskStatus.TO_DO]: 'To Do',
      [TaskStatus.IN_PROGRESS]: 'In Progress',
      [TaskStatus.IN_REVIEW]: 'In Review',
      [TaskStatus.DONE]: 'Done'
    };
    return statusLabels[status] || status;
  }

  getStatusColor(status: TaskStatus): string {
    const statusColors: Record<TaskStatus, string> = {
      [TaskStatus.TO_DO]: 'bg-gray-100 text-gray-800',
      [TaskStatus.IN_PROGRESS]: 'bg-blue-100 text-blue-800',
      [TaskStatus.IN_REVIEW]: 'bg-yellow-100 text-yellow-800',
      [TaskStatus.DONE]: 'bg-green-100 text-green-800'
    };
    return statusColors[status] || 'bg-gray-100 text-gray-800';
  }

  getStatusIcon(status: TaskStatus): string {
    const statusIcons: Record<TaskStatus, string> = {
      [TaskStatus.TO_DO]: '⭕',
      [TaskStatus.IN_PROGRESS]: '🔄',
      [TaskStatus.IN_REVIEW]: '👀',
      [TaskStatus.DONE]: '✅'
    };
    return statusIcons[status] || '⭕';
  }

  // ✅ Helper methods for task priority
  getPriorityLabel(priority: TaskPriority): string {
    const priorityLabels: Record<TaskPriority, string> = {
      [TaskPriority.LOW]: 'Low',
      [TaskPriority.MEDIUM]: 'Medium',
      [TaskPriority.HIGH]: 'High',
      [TaskPriority.URGENT]: 'Urgent'
    };
    return priorityLabels[priority] || priority;
  }

  getPriorityColor(priority: TaskPriority): string {
    const priorityColors: Record<TaskPriority, string> = {
      [TaskPriority.LOW]: 'bg-green-100 text-green-800',
      [TaskPriority.MEDIUM]: 'bg-yellow-100 text-yellow-800',
      [TaskPriority.HIGH]: 'bg-orange-100 text-orange-800',
      [TaskPriority.URGENT]: 'bg-red-100 text-red-800'
    };
    return priorityColors[priority] || 'bg-gray-100 text-gray-800';
  }

  getPriorityIcon(priority: TaskPriority): string {
    const priorityIcons: Record<TaskPriority, string> = {
      [TaskPriority.LOW]: '🟢',
      [TaskPriority.MEDIUM]: '🟡',
      [TaskPriority.HIGH]: '🟠',
      [TaskPriority.URGENT]: '🔴'
    };
    return priorityIcons[priority] || '⚪';
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

  // ✅ Format date for display (date only)
  formatDateOnly(dateString: string): string {
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
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

  // ✅ Check if task is overdue
  isTaskOverdue(task: TaskDto): boolean {
    if (!task.dueDate || task.status === TaskStatus.DONE) {
      return false;
    }
    
    try {
      const dueDate = new Date(task.dueDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Set to start of day
      
      return dueDate < today;
    } catch (error) {
      console.warn('⚠️ Invalid due date format:', task.dueDate);
      return false;
    }
  }

  // ✅ Get days until due date
  getDaysUntilDue(task: TaskDto): number | null {
    if (!task.dueDate) {
      return null;
    }
    
    try {
      const dueDate = new Date(task.dueDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Set to start of day
      
      const diffMs = dueDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      
      return diffDays;
    } catch (error) {
      console.warn('⚠️ Invalid due date format:', task.dueDate);
      return null;
    }
  }

  // ✅ Task statistics with all fields
  getTaskStatistics(tasks: TaskDto[]): any {
    const stats = {
      total: tasks.length,
      toDo: 0,
      inProgress: 0,
      inReview: 0,
      done: 0,
      overdue: 0,
      lowPriority: 0,
      mediumPriority: 0,
      highPriority: 0,
      urgentPriority: 0,
      totalEstimatedHours: 0,
      totalActualHours: 0,
      completionPercentage: 0
    };

    tasks.forEach(task => {
      // Status counts
      switch (task.status) {
        case TaskStatus.TO_DO:
          stats.toDo++;
          break;
        case TaskStatus.IN_PROGRESS:
          stats.inProgress++;
          break;
        case TaskStatus.IN_REVIEW:
          stats.inReview++;
          break;
        case TaskStatus.DONE:
          stats.done++;
          break;
      }

      // Priority counts
      switch (task.priority) {
        case TaskPriority.LOW:
          stats.lowPriority++;
          break;
        case TaskPriority.MEDIUM:
          stats.mediumPriority++;
          break;
        case TaskPriority.HIGH:
          stats.highPriority++;
          break;
        case TaskPriority.URGENT:
          stats.urgentPriority++;
          break;
      }

      // Overdue count
      if (this.isTaskOverdue(task)) {
        stats.overdue++;
      }

      // Hours
      if (task.estimatedHours) {
        stats.totalEstimatedHours += task.estimatedHours;
      }
      if (task.actualHours) {
        stats.totalActualHours += task.actualHours;
      }
    });

    if (stats.total > 0) {
      stats.completionPercentage = Math.round((stats.done / stats.total) * 100);
    }

    return stats;
  }

  // ✅ Filter tasks by various criteria
  filterTasksByStatus(tasks: TaskDto[], status: TaskStatus): TaskDto[] {
    return tasks.filter(task => task.status === status);
  }

  filterTasksByPriority(tasks: TaskDto[], priority: TaskPriority): TaskDto[] {
    return tasks.filter(task => task.priority === priority);
  }

  filterOverdueTasks(tasks: TaskDto[]): TaskDto[] {
    return tasks.filter(task => this.isTaskOverdue(task));
  }

  filterTasksByAssignee(tasks: TaskDto[], assigneeUsername: string): TaskDto[] {
    return tasks.filter(task => task.assigneeUsername === assigneeUsername);
  }

  // ✅ Sort tasks by various criteria
  sortTasksByDueDate(tasks: TaskDto[], ascending = true): TaskDto[] {
    return [...tasks].sort((a, b) => {
      if (!a.dueDate && !b.dueDate) return 0;
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      
      const dateA = new Date(a.dueDate);
      const dateB = new Date(b.dueDate);
      
      return ascending ? dateA.getTime() - dateB.getTime() : dateB.getTime() - dateA.getTime();
    });
  }

  sortTasksByPriority(tasks: TaskDto[], ascending = false): TaskDto[] {
    const priorityOrder = {
      [TaskPriority.URGENT]: 4,
      [TaskPriority.HIGH]: 3,
      [TaskPriority.MEDIUM]: 2,
      [TaskPriority.LOW]: 1
    };

    return [...tasks].sort((a, b) => {
      const priorityA = priorityOrder[a.priority] || 0;
      const priorityB = priorityOrder[b.priority] || 0;
      
      return ascending ? priorityA - priorityB : priorityB - priorityA;
    });
  }

  sortTasksByCreatedDate(tasks: TaskDto[], ascending = false): TaskDto[] {
    return [...tasks].sort((a, b) => {
      const dateA = new Date(a.createdAt);
      const dateB = new Date(b.createdAt);
      
      return ascending ? dateA.getTime() - dateB.getTime() : dateB.getTime() - dateA.getTime();
    });
  }

  // ✅ Refresh project tasks
  refreshProjectTasks(projectId: number): void {
    this.getProjectTasks(projectId).subscribe();
  }

  // ✅ Clear cached data
  clearCache(): void {
    this.tasksSubject.next([]);
  }

  // ✅ Private helper methods
  private updateTaskInList(updatedTask: TaskDto): void {
    const currentTasks = this.tasksSubject.value;
    const index = currentTasks.findIndex(task => task.id === updatedTask.id);
    
    if (index !== -1) {
      currentTasks[index] = updatedTask;
      this.tasksSubject.next([...currentTasks]);
    }
  }

  private removeTaskFromList(taskId: number): void {
    const currentTasks = this.tasksSubject.value;
    const filteredTasks = currentTasks.filter(task => task.id !== taskId);
    this.tasksSubject.next(filteredTasks);
  }

  // ✅ Authentication and token methods
  isAuthenticated(): boolean {
    const token = this.getToken();
    return !!token && !this.isTokenExpired(token);
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

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

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem(this.TOKEN_KEY);
    const currentUser = this.getCurrentUsername();
    
    console.log('🔑 TaskService: Getting headers for user:', currentUser);
    console.log('🔑 Token found:', token ? 'Yes' : 'No');
    
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
    console.error('🚨 TaskService Error Details for user:', currentUser);
    console.error('🚨 Error:', error);
    
    if (error.status === 401) {
      console.error('❌ Unauthorized - Token may be invalid or expired');
      return 'Your session has expired. Please log in again.';
    }
    
    if (error.status === 403) {
      console.error('❌ Forbidden - User may not have permission');
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

  // ✅ Get current state
  get currentTasks(): TaskDto[] {
    return this.tasksSubject.value;
  }

  get currentTasksCount(): number {
    return this.tasksSubject.value.length;
  }

  get isLoading(): boolean {
    return this.loadingSubject.value;
  }
}