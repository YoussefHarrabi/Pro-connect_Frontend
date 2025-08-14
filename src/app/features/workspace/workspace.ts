import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { Subject, takeUntil } from 'rxjs';
import { FileManagerComponent } from './components/file-manager/file-manager';
import { TaskBoardComponent } from './components/task-board/task-board';
import { WorkspaceChatComponent } from './components/workspace-chat/workspace-chat';
import { SharedNavbar, NavbarConfig } from '../../shared/components/shared-navbar/shared-navbar';
import { SharedFooter } from '../../shared/components/shared-footer/shared-footer';

// Import services and DTOs
import { 
  ProjectService, 
  ProjectDto, 
  ProjectStatus 
} from '../../shared/services/project.service';
import { 
  TaskService, 
  TaskDto, 
  TaskCreateRequest, 
  TaskStatus,
  TaskPriority
} from '../../shared/services/task.service';
import { 
  FileAttachmentService, 
  FileAttachmentDto 
} from '../../shared/services/file-attachment.service';

// ✅ Only keep workspace-specific interfaces (not duplicated in services)
interface Task {
  id: string;
  title: string;
  description: string;
  status: 'todo' | 'inprogress' | 'inreview' | 'done';
  assignee: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  dueDate: Date | null;
  estimatedHours: number | null;
  actualHours: number | null;
  notes: string;
  comments: Comment[];
  attachments: FileAttachment[];
  createdAt: Date;
  updatedAt: Date;
  isOverdue: boolean;
  isCompleted: boolean;
}

interface Comment {
  id: string;
  author: string;
  authorRole: 'client' | 'freelancer';
  content: string;
  timestamp: Date;
  attachments?: FileAttachment[];
}

interface FileAttachment {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  uploadedBy: string;
  uploadedAt: Date;
}

interface ChatMessage {
  id: string;
  sender: string;
  senderRole: 'client' | 'freelancer';
  content: string;
  timestamp: Date;
  attachments?: FileAttachment[];
  isRead: boolean;
}

interface ProjectWorkspace {
  id: string;
  projectTitle: string;
  clientName: string;
  freelancerName: string;
  status: 'active' | 'completed' | 'archived';
  startDate: Date;
  deadline: Date;
  budget: number;
  description: string;
  tasks: Task[];
  chatMessages: ChatMessage[];
  files: FileAttachment[];
}

@Component({
  selector: 'app-workspace',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    TranslateModule,
    TaskBoardComponent,
    WorkspaceChatComponent,
    FileManagerComponent,
    SharedNavbar,
    SharedFooter
  ],
  templateUrl: './workspace.html',
  styleUrls: ['./workspace.scss']
})
export class WorkspaceComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // Project data
  projectId!: number;
  project: ProjectDto | null = null;
  
  // Component state
  activeTab: 'overview' | 'tasks' | 'chat' | 'files' = 'overview';
  isLoading = true;
  currentUserRole: 'client' | 'freelancer' = 'client';
  
  // Data arrays - real backend data
  backendTasks: TaskDto[] = [];
  backendFiles: FileAttachmentDto[] = [];
  
  // Mock data for chat (until chat service is implemented)
  mockChatMessages: ChatMessage[] = [
    {
      id: 'msg-001',
      sender: 'John Smith',
      senderRole: 'client',
      content: 'Hi! Excited to start working on this project!',
      timestamp: new Date('2024-01-15T09:00:00'),
      isRead: true
    },
    {
      id: 'msg-002',
      sender: 'Sarah Johnson',
      senderRole: 'freelancer',
      content: 'Hello! Thank you for choosing me. I\'ll start with the tasks as discussed.',
      timestamp: new Date('2024-01-15T09:15:00'),
      isRead: true
    }
  ];

  // ✅ Workspace object mapped from real data
  workspace: ProjectWorkspace = {
    id: '',
    projectTitle: '',
    clientName: '',
    freelancerName: '',
    status: 'active',
    startDate: new Date(),
    deadline: new Date(),
    budget: 0,
    description: '',
    tasks: [],
    chatMessages: [],
    files: []
  };

  // Shared navbar configuration
  sharedNavbarConfig: NavbarConfig = {
    title: 'Pro-Connect Workspace',
    showLanguageToggle: true,
    showProfileLink: true,
    showLogoutButton: true,
    customButtons: [
      {
        label: 'projectPosting.header.dashboard',
        route: '/client-dashboard',
        class: 'text-primary-600 hover:text-primary-700'
      }
    ]
  };

  // Forms
  projectCompletionForm!: FormGroup;
  showCompletionModal = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private projectService: ProjectService,
    private taskService: TaskService,
    private fileService: FileAttachmentService
  ) {
    this.initializeForms();
  }

  ngOnInit(): void {
    console.log('🚀 WorkspaceComponent: ngOnInit started');
    console.log('👤 Current user:', this.getCurrentUsername());
    
    const projectIdParam = this.route.snapshot.paramMap.get('id');
    console.log('📋 Project ID from route:', projectIdParam);
    
    if (!projectIdParam || isNaN(Number(projectIdParam))) {
      console.error('❌ Invalid project ID:', projectIdParam);
      this.router.navigate(['/client-dashboard']);
      return;
    }
    
    this.projectId = Number(projectIdParam);
    console.log('✅ Project ID set to:', this.projectId);
    
    this.loadWorkspaceData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForms(): void {
    this.projectCompletionForm = this.fb.group({
      completionNotes: ['', Validators.required],
      rating: [5, [Validators.required, Validators.min(1), Validators.max(5)]],
      publicReview: ['', Validators.required]
    });
  }

  // ✅ Load real data from backend services
  private loadWorkspaceData(): void {
    console.log('🔄 Starting to load workspace data for project:', this.projectId);
    this.isLoading = true;
    
    // Load project first
    this.projectService.getProjectById(this.projectId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (project) => {
          console.log('✅ Project loaded successfully:', project?.title);
          this.project = project;
          
          if (!project) {
            console.error('❌ Project not found');
            this.router.navigate(['/client-dashboard']);
            return;
          }
          
          this.mapProjectToWorkspace(project);
          this.determineUserRole();
          this.updateNavbarTitle();
          
          // Load tasks and files
          this.loadTasksAndFiles();
        },
        error: (error) => {
          console.error('❌ Error loading project:', error);
          this.isLoading = false;
          this.router.navigate(['/client-dashboard']);
        }
      });
  }

  private loadTasksAndFiles(): void {
    console.log('🔄 Loading tasks and files...');
    
    // Load tasks
    this.taskService.getProjectTasks(this.projectId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (tasks) => {
          console.log('✅ Tasks loaded:', tasks?.length || 0);
          console.log('📋 Task details:', tasks);
          this.backendTasks = tasks || [];
          this.mapTasksToWorkspace();
          this.checkIfLoadingComplete();
        },
        error: (error) => {
          console.error('❌ Error loading tasks:', error);
          this.backendTasks = [];
          this.mapTasksToWorkspace();
          this.checkIfLoadingComplete();
        }
      });
    
    // Load files
    this.fileService.getProjectFiles(this.projectId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (files) => {
          console.log('✅ Files loaded:', files?.length || 0);
          this.backendFiles = files || [];
          this.mapFilesToWorkspace();
          this.checkIfLoadingComplete();
        },
        error: (error) => {
          console.error('❌ Error loading files (expected if not implemented):', error);
          this.backendFiles = [];
          this.mapFilesToWorkspace();
          this.checkIfLoadingComplete();
        }
      });
  }

  private checkIfLoadingComplete(): void {
    if (this.backendTasks !== undefined && this.backendFiles !== undefined) {
      console.log('✅ All data loaded');
      this.workspace.chatMessages = this.mockChatMessages; // Use mock chat for now
      this.isLoading = false;
      console.log('✅ Loading complete! isLoading set to false');
    }
  }

  // ✅ Map backend project data to workspace
  private mapProjectToWorkspace(project: ProjectDto): void {
    this.workspace.id = project.id.toString();
    this.workspace.projectTitle = project.title;
    this.workspace.clientName = project.clientUsername || 'Client';
    this.workspace.freelancerName = project.assignedTalentUsername || 'Not assigned';
    this.workspace.status = this.mapProjectStatus(project.status);
    this.workspace.startDate = new Date(project.createdAt);
    this.workspace.deadline = project.deadline ? new Date(project.deadline) : new Date();
    this.workspace.budget = project.budgetMax || 0;
    this.workspace.description = project.description;
    
    console.log('🏗️ Mapped project to workspace:', {
      clientName: this.workspace.clientName,
      freelancerName: this.workspace.freelancerName,
      currentUser: this.getCurrentUsername()
    });
  }

  // ✅ Map backend tasks to workspace tasks
  private mapTasksToWorkspace(): void {
    this.workspace.tasks = this.backendTasks.map(task => this.mapTaskToWorkspaceTask(task));
    console.log('📋 Mapped tasks to workspace:', this.workspace.tasks.length);
  }

  // ✅ Map backend files to workspace files
  private mapFilesToWorkspace(): void {
    this.workspace.files = this.backendFiles.map(file => this.mapFileToWorkspaceFile(file));
  }

  // ✅ Map single backend task to workspace task - Using service DTOs
  private mapTaskToWorkspaceTask(task: TaskDto): Task {
    return {
      id: task.id.toString(),
      title: task.title,
      description: task.description || '',
      status: this.mapTaskStatus(task.status),
      assignee: task.assigneeUsername || 'Unassigned',
      priority: this.mapTaskPriority(task.priority),
      dueDate: task.dueDate ? new Date(task.dueDate) : null,
      estimatedHours: task.estimatedHours || null,
      actualHours: task.actualHours || null,
      notes: task.notes || '',
      comments: [], // Will be loaded separately if needed
      attachments: [], // Will be loaded separately if needed
      createdAt: new Date(task.createdAt),
      updatedAt: new Date(task.updatedAt),
      isOverdue: task.isOverdue || false,
      isCompleted: task.isCompleted || false
    };
  }

  // ✅ Map single backend file to workspace file
  private mapFileToWorkspaceFile(file: FileAttachmentDto): FileAttachment {
    return {
      id: file.id.toString(),
      name: file.fileName,
      size: file.size,
      type: file.fileType,
      url: file.downloadUrl,
      uploadedBy: file.uploaderUsername,
      uploadedAt: new Date(file.createdAt)
    };
  }

  // ✅ Mapping helper methods - Using service enums
  private mapProjectStatus(status: ProjectStatus): 'active' | 'completed' | 'archived' {
    switch (status) {
      case ProjectStatus.IN_PROGRESS:
        return 'active';
      case ProjectStatus.COMPLETED:
        return 'completed';
      case ProjectStatus.CLOSED:
        return 'archived';
      default:
        return 'active';
    }
  }

  private mapTaskStatus(status: TaskStatus): 'todo' | 'inprogress' | 'inreview' | 'done' {
    switch (status) {
      case TaskStatus.TO_DO:
        return 'todo';
      case TaskStatus.IN_PROGRESS:
        return 'inprogress';
      case TaskStatus.IN_REVIEW:
        return 'inreview';
      case TaskStatus.DONE:
        return 'done';
      default:
        return 'todo';
    }
  }

  // ✅ Updated to handle URGENT priority from service enum
  private mapTaskPriority(priority: TaskPriority | null): 'low' | 'medium' | 'high' | 'urgent' {
    if (!priority) return 'medium';
    switch (priority) {
      case TaskPriority.LOW:
        return 'low';
      case TaskPriority.MEDIUM:
        return 'medium';
      case TaskPriority.HIGH:
        return 'high';
      case TaskPriority.URGENT:
        return 'urgent';
      default:
        return 'medium';
    }
  }

  private mapWorkspaceTaskStatusToBackend(status: 'todo' | 'inprogress' | 'inreview' | 'done'): TaskStatus {
    switch (status) {
      case 'todo':
        return TaskStatus.TO_DO;
      case 'inprogress':
        return TaskStatus.IN_PROGRESS;
      case 'inreview':
        return TaskStatus.IN_REVIEW;
      case 'done':
        return TaskStatus.DONE;
      default:
        return TaskStatus.TO_DO;
    }
  }

  private determineUserRole(): void {
    if (this.project) {
      const currentUser = this.getCurrentUsername();
      this.currentUserRole = this.project.clientUsername === currentUser ? 'client' : 'freelancer';
      console.log('✅ User role determined:', this.currentUserRole);
      console.log('📋 Project client:', this.project.clientUsername);
      console.log('📋 Project freelancer:', this.project.assignedTalentUsername);
      console.log('👤 Current user:', currentUser);
    }
  }

  public getCurrentUsername(): string {
    const token = localStorage.getItem('auth-token');
    if (!token) return '';
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.sub || payload.username || '';
    } catch (error) {
      return '';
    }
  }

  private updateNavbarTitle(): void {
    if (this.project) {
      this.sharedNavbarConfig.title = `${this.project.title} - Workspace`;
      console.log('✅ Navbar title updated');
    }
  }

  // ✅ Component methods
  setActiveTab(tab: string): void {
    this.activeTab = tab as 'overview' | 'tasks' | 'chat' | 'files';
  }

  getTasksByStatus(status: string): Task[] {
    return this.workspace.tasks.filter(task => task.status === status);
  }

  getUnreadMessagesCount(): number {
    return this.workspace.chatMessages.filter(msg => !msg.isRead).length;
  }

// ✅ Updated progress calculation based on estimated hours of completed tasks
getProjectProgress(): number {
  if (!this.workspace.tasks || this.workspace.tasks.length === 0) {
    return 0;
  }

  // ✅ Calculate total estimated hours for all tasks
  const totalEstimatedHours = this.workspace.tasks.reduce((sum, task) => {
    return sum + (task.estimatedHours || 0);
  }, 0);

  // ✅ Calculate estimated hours for completed tasks only
  const completedTasks = this.workspace.tasks.filter(task => task.status === 'done');
  const completedEstimatedHours = completedTasks.reduce((sum, task) => {
    return sum + (task.estimatedHours || 0);
  }, 0);

  console.log(`📊 Workspace Progress Calculation:`);
  console.log(`  - Total tasks: ${this.workspace.tasks.length}`);
  console.log(`  - Completed tasks: ${completedTasks.length}`);
  console.log(`  - Total estimated hours: ${totalEstimatedHours}h`);
  console.log(`  - Completed estimated hours: ${completedEstimatedHours}h`);

  // ✅ Log individual task details for debugging
  this.workspace.tasks.forEach(task => {
    console.log(`    - "${task.title}": ${task.estimatedHours || 0}h (${task.status}) ${task.status === 'done' ? '✅' : '❌'}`);
  });

  // ✅ Apply your exact formula: (completedEstimatedHours * 100) / totalEstimatedHours
  if (totalEstimatedHours > 0) {
    const progress = Math.round((completedEstimatedHours * 100) / totalEstimatedHours);
    console.log(`📊 Progress formula: (${completedEstimatedHours} × 100) ÷ ${totalEstimatedHours} = ${progress}%`);
    return progress;
  } else {
    // Fallback to task count if no estimated hours
    const taskProgress = Math.round((completedTasks.length / this.workspace.tasks.length) * 100);
    console.log(`📊 No estimated hours found, using task count: ${completedTasks.length}/${this.workspace.tasks.length} = ${taskProgress}%`);
    return taskProgress;
  }
}

// ✅ Additional helper method to get detailed progress info
getProgressDetails(): any {
  if (!this.workspace.tasks || this.workspace.tasks.length === 0) {
    return {
      totalTasks: 0,
      completedTasks: 0,
      totalEstimatedHours: 0,
      completedEstimatedHours: 0,
      formula: 'No tasks available',
      calculation: 'N/A',
      percentage: 0
    };
  }

  const totalEstimatedHours = this.workspace.tasks.reduce((sum, task) => sum + (task.estimatedHours || 0), 0);
  const completedTasks = this.workspace.tasks.filter(task => task.status === 'done');
  const completedEstimatedHours = completedTasks.reduce((sum, task) => sum + (task.estimatedHours || 0), 0);
  const progress = this.getProjectProgress();

  return {
    totalTasks: this.workspace.tasks.length,
    completedTasks: completedTasks.length,
    totalEstimatedHours,
    completedEstimatedHours,
    formula: totalEstimatedHours > 0 ? 
      '(Completed Estimated Hours × 100) ÷ Total Estimated Hours' : 
      'Task Count (no time estimates)',
    calculation: totalEstimatedHours > 0 ? 
      `(${completedEstimatedHours} × 100) ÷ ${totalEstimatedHours} = ${progress}%` :
      `${completedTasks.length}/${this.workspace.tasks.length} tasks = ${progress}%`,
    percentage: progress
  };
}

// ✅ Get progress color based on percentage
getProgressColor(): string {
  const progress = this.getProjectProgress();
  if (progress >= 80) return 'bg-green-600';
  if (progress >= 60) return 'bg-blue-600';
  if (progress >= 40) return 'bg-yellow-600';
  if (progress >= 20) return 'bg-orange-500';
  return 'bg-red-500';
}

// ✅ Get efficiency indicator
getProjectEfficiency(): string {
  const details = this.getProgressDetails();
  
  if (details.totalEstimatedHours === 0) return 'No time estimates';
  
  // Calculate actual hours spent
  const actualHoursSpent = this.workspace.tasks.reduce((sum, task) => sum + (task.actualHours || 0), 0);
  
  if (actualHoursSpent === 0) return 'Not started';
  
  const efficiency = (details.completedEstimatedHours / actualHoursSpent) * 100;
  if (efficiency > 120) return 'Highly efficient';
  if (efficiency > 100) return 'Ahead of estimate';
  if (efficiency > 80) return 'On track';
  if (efficiency > 60) return 'Slightly behind';
  return 'Needs attention';
}

  openCompletionModal(): void {
    this.showCompletionModal = true;
  }

  closeCompletionModal(): void {
    this.showCompletionModal = false;
    this.projectCompletionForm.reset();
  }

  markProjectComplete(): void {
    if (this.projectCompletionForm.valid) {
      console.log('Project completion data:', this.projectCompletionForm.value);
      this.closeCompletionModal();
      alert('Project completion feature will be implemented with the backend API.');
    }
  }

  canCompleteProject(): boolean {
    return this.currentUserRole === 'client' && 
           this.workspace.status === 'active' &&
           this.workspace.tasks.every(task => task.status === 'done');
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100';
      case 'completed': return 'text-blue-600 bg-blue-100';
      case 'archived': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  }

  // ✅ Updated priority colors to include urgent
  getPriorityColor(priority: string): string {
    switch (priority) {
      case 'urgent': return 'text-red-700 bg-red-200';
      case 'high': return 'text-red-600 bg-red-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  }

  formatDate(date: Date | string | null): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString();
  }

  getDaysRemaining(): number {
    const today = new Date();
    const deadline = new Date(this.workspace.deadline);
    const timeDiff = deadline.getTime() - today.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
    return Math.max(0, daysDiff);
  }

  // ✅ Event handlers for child components
  onTaskUpdated(task: Task): void {
    console.log('🔄 Task updated:', task);
    
    const backendStatus = this.mapWorkspaceTaskStatusToBackend(task.status);
    
    this.taskService.updateTaskStatus(Number(task.id), backendStatus)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (updatedTask) => {
          console.log('✅ Task updated in backend:', updatedTask);
          const index = this.backendTasks.findIndex(t => t.id === Number(task.id));
          if (index !== -1) {
            this.backendTasks[index] = updatedTask;
            this.mapTasksToWorkspace();
          }
        },
        error: (error) => {
          console.error('❌ Error updating task:', error);
          this.loadTasksAndFiles();
        }
      });
  }

  // ✅ Updated task creation with proper assignee handling
 onTaskCreated(taskData: any): void {
  console.log('📝 Creating new task from TaskBoard:', taskData);
  console.log('🏗️ Current project freelancer:', this.workspace.freelancerName);
  console.log('👤 Current user:', this.getCurrentUsername());
  
  // ✅ Auto-assign to project's freelancer if no specific assignee provided
  let assigneeUsername = null;
  
  if (taskData.assignee && taskData.assignee !== 'Unassigned') {
    assigneeUsername = taskData.assignee;
    console.log('📋 Using specified assignee:', assigneeUsername);
  } else if (this.workspace.freelancerName && this.workspace.freelancerName !== 'Not assigned') {
    assigneeUsername = this.workspace.freelancerName;
    console.log('📋 Auto-assigning to project freelancer:', assigneeUsername);
  } else {
    console.log('📋 No assignee specified and no project freelancer available');
  }
  
  // ✅ Create the request with ALL fields properly mapped
  const createRequest: TaskCreateRequest = {
    title: taskData.title || 'New Task',
    description: taskData.description || '',
    priority: this.mapWorkspacePriorityToBackend(taskData.priority || 'MEDIUM'),
    dueDate: taskData.dueDate ? this.formatDateForBackend(taskData.dueDate) : undefined,
    estimatedHours: taskData.estimatedHours || null,
    notes: taskData.notes || '',
    assigneeUsername: assigneeUsername || null
  };
  
  // ✅ Enhanced logging to debug what's being sent
  console.log('📝 Sending to backend:', createRequest);
  console.log('📝 Request details:');
  console.log('  - Title:', createRequest.title);
  console.log('  - Description:', createRequest.description);
  console.log('  - Priority:', createRequest.priority);
  console.log('  - Due Date:', createRequest.dueDate);
  console.log('  - Estimated Hours:', createRequest.estimatedHours);
  console.log('  - Notes:', createRequest.notes);
  console.log('  - Assignee Username:', createRequest.assigneeUsername);
  
  this.taskService.createTask(this.projectId, createRequest)
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (createdTask) => {
        console.log('✅ Task created in backend:', createdTask);
        this.backendTasks.push(createdTask);
        this.mapTasksToWorkspace();
      },
      error: (error) => {
        console.error('❌ Error creating task:', error);
        alert('Error creating task: ' + (error.message || error));
      }
    });
}

  // ✅ Helper methods using service enums
  private formatDateForBackend(date: Date | string | null): string | undefined {
    if (!date) return undefined;
    
    if (typeof date === 'string') {
      return date;
    }
    
    if (date instanceof Date) {
      return date.toISOString().split('T')[0];
    }
    
    return undefined;
  }

  private mapWorkspacePriorityToBackend(priority: string): TaskPriority {
    switch (priority.toUpperCase()) {
      case 'LOW':
        return TaskPriority.LOW;
      case 'MEDIUM':
        return TaskPriority.MEDIUM;
      case 'HIGH':
        return TaskPriority.HIGH;
      case 'URGENT':
        return TaskPriority.URGENT;
      default:
        return TaskPriority.MEDIUM;
    }
  }

  onMessageSent(messageData: Omit<ChatMessage, 'id' | 'timestamp' | 'isRead'>): void {
    const newMessage: ChatMessage = {
      ...messageData,
      id: 'msg-' + Date.now(),
      timestamp: new Date(),
      isRead: false
    };
    this.workspace.chatMessages.push(newMessage);
    console.log('💬 Message sent (mock):', newMessage);
  }

  onFileUploaded(fileData: Omit<FileAttachment, 'id' | 'uploadedAt'>): void {
    console.log('📁 File upload requested:', fileData);
    alert('File upload feature will be implemented with the backend API.');
  }

  onFileDeleted(fileId: string): void {
    console.log('🗑️ Deleting file:', fileId);
    
    this.fileService.deleteFile(Number(fileId))
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          console.log('✅ File deleted from backend');
          this.backendFiles = this.backendFiles.filter(file => file.id !== Number(fileId));
          this.mapFilesToWorkspace();
        },
        error: (error) => {
          console.error('❌ Error deleting file:', error);
          alert('Error deleting file: ' + error);
        }
      });
  }
}