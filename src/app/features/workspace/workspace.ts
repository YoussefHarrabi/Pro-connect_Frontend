import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { FileManagerComponent } from './components/file-manager/file-manager';
import { TaskBoardComponent } from './components/task-board/task-board';
import { SharedNavbar, NavbarConfig } from '../../shared/components/shared-navbar/shared-navbar';
import { SharedFooter } from '../../shared/components/shared-footer/shared-footer';

// Import workspace components

interface Task {
  id: string;
  title: string;
  description: string;
  status: 'todo' | 'inprogress' | 'inreview' | 'done';
  assignee: string;
  priority: 'low' | 'medium' | 'high';
  dueDate: Date;
  comments: Comment[];
  attachments: FileAttachment[];
  createdAt: Date;
  updatedAt: Date;
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
    FileManagerComponent,
    SharedNavbar,
    SharedFooter
  ],
  templateUrl: './workspace.html',
  styleUrls: ['./workspace.scss']
})
export class WorkspaceComponent implements OnInit {
  // Shared navbar configuration
  sharedNavbarConfig: NavbarConfig = {
    title: 'Pro-Connect',
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

  navbarConfig = {
    showBackButton: true,
    backRoute: '/client-dashboard',
    customButtons: [
      {
        label: 'workspace.navbar.overview',
        action: () => this.setActiveTab('overview')
      },
      {
        label: 'workspace.navbar.tasks',
        action: () => this.setActiveTab('tasks')
      },
      {
        label: 'workspace.navbar.files',
        action: () => this.setActiveTab('files')
      }
    ]
  };

  activeTab: 'overview' | 'tasks' | 'files' = 'overview';
  currentUserRole: 'client' | 'freelancer' = 'client'; // Mock current user role
  
  // Mock workspace data
  workspace: ProjectWorkspace = {
    id: 'ws-001',
    projectTitle: 'E-commerce Website Development',
    clientName: 'John Smith',
    freelancerName: 'Sarah Johnson',
    status: 'active',
    startDate: new Date('2024-01-15'),
    deadline: new Date('2024-03-15'),
    budget: 5000,
    description: 'Development of a modern e-commerce website with shopping cart, payment integration, and admin panel.',
    tasks: [
      {
        id: 'task-001',
        title: 'Homepage Design',
        description: 'Create responsive homepage design with modern UI',
        status: 'done',
        assignee: 'Sarah Johnson',
        priority: 'high',
        dueDate: new Date('2024-01-25'),
        comments: [
          {
            id: 'comment-001',
            author: 'John Smith',
            authorRole: 'client',
            content: 'Looks great! Please add the company logo in the header.',
            timestamp: new Date('2024-01-20T10:30:00')
          },
          {
            id: 'comment-002',
            author: 'Sarah Johnson',
            authorRole: 'freelancer',
            content: 'Logo has been added. Ready for review.',
            timestamp: new Date('2024-01-21T14:15:00')
          }
        ],
        attachments: [
          {
            id: 'file-001',
            name: 'homepage-mockup.png',
            size: 1024000,
            type: 'image/png',
            url: '/assets/mock-files/homepage-mockup.png',
            uploadedBy: 'Sarah Johnson',
            uploadedAt: new Date('2024-01-20T09:00:00')
          }
        ],
        createdAt: new Date('2024-01-15T08:00:00'),
        updatedAt: new Date('2024-01-21T14:15:00')
      },
      {
        id: 'task-002',
        title: 'Product Catalog Implementation',
        description: 'Implement product listing and detail pages',
        status: 'inprogress',
        assignee: 'Sarah Johnson',
        priority: 'high',
        dueDate: new Date('2024-02-05'),
        comments: [],
        attachments: [],
        createdAt: new Date('2024-01-22T10:00:00'),
        updatedAt: new Date('2024-01-25T16:30:00')
      },
      {
        id: 'task-003',
        title: 'Payment Gateway Integration',
        description: 'Integrate Stripe payment system',
        status: 'todo',
        assignee: 'Sarah Johnson',
        priority: 'medium',
        dueDate: new Date('2024-02-15'),
        comments: [],
        attachments: [],
        createdAt: new Date('2024-01-25T12:00:00'),
        updatedAt: new Date('2024-01-25T12:00:00')
      },
      {
        id: 'task-004',
        title: 'Admin Panel Development',
        description: 'Create admin dashboard for managing products and orders',
        status: 'inreview',
        assignee: 'Sarah Johnson',
        priority: 'medium',
        dueDate: new Date('2024-02-20'),
        comments: [
          {
            id: 'comment-003',
            author: 'Sarah Johnson',
            authorRole: 'freelancer',
            content: 'Admin panel is ready for testing. Please check the user management section.',
            timestamp: new Date('2024-01-28T11:00:00')
          }
        ],
        attachments: [],
        createdAt: new Date('2024-01-26T09:00:00'),
        updatedAt: new Date('2024-01-28T11:00:00')
      }
    ],
    files: [
      {
        id: 'file-001',
        name: 'homepage-mockup.png',
        size: 1024000,
        type: 'image/png',
        url: '/assets/mock-files/homepage-mockup.png',
        uploadedBy: 'Sarah Johnson',
        uploadedAt: new Date('2024-01-20T09:00:00')
      },
      {
        id: 'file-002',
        name: 'project-requirements.pdf',
        size: 2048000,
        type: 'application/pdf',
        url: '/assets/mock-files/project-requirements.pdf',
        uploadedBy: 'John Smith',
        uploadedAt: new Date('2024-01-15T10:00:00')
      },
      {
        id: 'file-003',
        name: 'brand-assets.zip',
        size: 5120000,
        type: 'application/zip',
        url: '/assets/mock-files/brand-assets.zip',
        uploadedBy: 'John Smith',
        uploadedAt: new Date('2024-01-16T14:30:00')
      }
    ]
  };

  // Forms
  projectCompletionForm: FormGroup;
  showCompletionModal = false;

  constructor(private fb: FormBuilder) {
    this.projectCompletionForm = this.fb.group({
      completionNotes: ['', Validators.required],
      rating: [5, [Validators.required, Validators.min(1), Validators.max(5)]],
      publicReview: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    // Initialize component
  }

  setActiveTab(tab: string): void {
    this.activeTab = tab as 'overview' | 'tasks' | 'files';
  }

  getTasksByStatus(status: string): Task[] {
    return this.workspace.tasks.filter(task => task.status === status);
  }

  getProjectProgress(): number {
    const completedTasks = this.workspace.tasks.filter(task => task.status === 'done').length;
    const totalTasks = this.workspace.tasks.length;
    return totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
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
      // Mock completion logic
      this.workspace.status = 'completed';
      console.log('Project marked as complete:', this.projectCompletionForm.value);
      this.closeCompletionModal();
      
      // Show success message or redirect
      alert('Project has been marked as complete! The workspace has been archived and the review process has been initiated.');
    }
  }

  canCompleteProject(): boolean {
    // Only client can complete the project and all tasks should be done
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

  getPriorityColor(priority: string): string {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString();
  }

  getDaysRemaining(): number {
    const today = new Date();
    const deadline = new Date(this.workspace.deadline);
    const timeDiff = deadline.getTime() - today.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
    return Math.max(0, daysDiff);
  }

  // Event handlers for child components
  onTaskUpdated(task: Task): void {
    const index = this.workspace.tasks.findIndex(t => t.id === task.id);
    if (index !== -1) {
      this.workspace.tasks[index] = task;
    }
  }

  onTaskCreated(taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): void {
    const newTask: Task = {
      ...taskData,
      id: 'task-' + Date.now(),
      comments: [],
      attachments: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.workspace.tasks.push(newTask);
  }

  onFileUploaded(fileData: Omit<FileAttachment, 'id' | 'uploadedAt'>): void {
    const newFile: FileAttachment = {
      ...fileData,
      id: 'file-' + Date.now(),
      uploadedAt: new Date()
    };
    this.workspace.files.push(newFile);
  }

  onFileDeleted(fileId: string): void {
    this.workspace.files = this.workspace.files.filter(file => file.id !== fileId);
  }
}
