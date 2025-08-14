import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

// ✅ Updated Task interface with all fields to match backend
interface Task {
  id: string;
  title: string;
  description: string;
  status: 'todo' | 'inprogress' | 'inreview' | 'done';
  assignee: string;
  priority: 'low' | 'medium' | 'high' | 'urgent'; // ✅ Added 'urgent'
  dueDate: Date | null; // ✅ Made nullable
  estimatedHours: number | null; // ✅ Added
  actualHours: number | null; // ✅ Added
  notes: string; // ✅ Added
  comments: Comment[];
  attachments: FileAttachment[];
  createdAt: Date;
  updatedAt: Date;
  isOverdue: boolean; // ✅ Added
  isCompleted: boolean; // ✅ Added
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

@Component({
  selector: 'app-task-board',
  standalone: true,
  imports: [CommonModule, TranslateModule, ReactiveFormsModule],
  templateUrl: './task-board.html',
  styleUrls: ['./task-board.scss']
})
export class TaskBoardComponent implements OnInit {
  @Input() tasks: Task[] = [];
  @Input() currentUserRole: 'client' | 'freelancer' = 'client';
  @Input() projectClientName: string = 'Client'; // ✅ Added for dynamic assignee options
  @Input() projectFreelancerName: string = 'Freelancer'; // ✅ Added for dynamic assignee options
  
  @Output() taskUpdated = new EventEmitter<Task>();
  @Output() taskCreated = new EventEmitter<any>(); // ✅ Emit raw form data

  showTaskModal = false;
  showTaskDetailModal = false;
  selectedTask: Task | null = null;
  taskForm: FormGroup;
  commentForm: FormGroup;

  columns = [
    { id: 'todo', title: 'workspace.kanban.todo', color: 'bg-gray-100 border-gray-300' },
    { id: 'inprogress', title: 'workspace.kanban.inProgress', color: 'bg-blue-100 border-blue-300' },
    { id: 'inreview', title: 'workspace.kanban.inReview', color: 'bg-yellow-100 border-yellow-300' },
    { id: 'done', title: 'workspace.kanban.done', color: 'bg-green-100 border-green-300' }
  ];

  constructor(private fb: FormBuilder) {
    // ✅ Updated form with all fields
    this.taskForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
      description: ['', [Validators.maxLength(500)]],
      priority: ['medium', Validators.required],
      dueDate: [''],
      estimatedHours: ['', [Validators.min(1)]],
      notes: [''],
      assignee: [''] // Will be populated based on project data
    });

    this.commentForm = this.fb.group({
      content: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    console.log('🎯 TaskBoardComponent initialized');
    console.log('📋 Tasks received:', this.tasks.length);
    console.log('👤 Current user role:', this.currentUserRole);
    console.log('🏗️ Project client:', this.projectClientName);
    console.log('👨‍💻 Project freelancer:', this.projectFreelancerName);
  }

  getTasksByStatus(status: string): Task[] {
    return this.tasks.filter(task => task.status === status);
  }

  openTaskModal(): void {
    this.showTaskModal = true;
    this.taskForm.reset();
    
    // ✅ Set default values
    this.taskForm.patchValue({
      priority: 'medium',
      assignee: this.projectFreelancerName !== 'Not assigned' ? this.projectFreelancerName : ''
    });
    
    console.log('📝 TaskBoard: Modal opened, form reset with defaults');
  }

  closeTaskModal(): void {
    this.showTaskModal = false;
  }

  openTaskDetail(task: Task): void {
    this.selectedTask = task;
    this.showTaskDetailModal = true;
  }

  closeTaskDetail(): void {
    this.showTaskDetailModal = false;
    this.selectedTask = null;
  }

  // ✅ Updated createTask to emit all form data
createTask(): void {
  if (this.taskForm.valid) {
    const formValue = this.taskForm.value;
    
    // ✅ Enhanced logging to see what form contains
    console.log('📝 TaskBoard form value:', formValue);
    
    // ✅ Prepare complete task data with proper type conversion
    const newTaskData = {
      title: formValue.title ? formValue.title.trim() : '',
      description: formValue.description ? formValue.description.trim() : '',
      priority: formValue.priority || 'medium',
      dueDate: formValue.dueDate || null,
      estimatedHours: formValue.estimatedHours ? parseInt(formValue.estimatedHours, 10) : null,
      notes: formValue.notes ? formValue.notes.trim() : '',
      assignee: formValue.assignee || null,
      status: 'todo' // Default status
    };
    
    console.log('📝 TaskBoard: Emitting complete task creation data:', newTaskData);
    console.log('📝 Task data details:');
    console.log('  - Title:', newTaskData.title);
    console.log('  - Description:', newTaskData.description);
    console.log('  - Priority:', newTaskData.priority);
    console.log('  - Due Date:', newTaskData.dueDate);
    console.log('  - Estimated Hours:', newTaskData.estimatedHours);
    console.log('  - Notes:', newTaskData.notes);
    console.log('  - Assignee:', newTaskData.assignee);
    
    this.taskCreated.emit(newTaskData);
    this.closeTaskModal();
  } else {
    console.log('❌ TaskBoard: Form is invalid');
    console.log('❌ Form errors:', this.taskForm.errors);
    console.log('❌ Form controls status:');
    Object.keys(this.taskForm.controls).forEach(key => {
      const control = this.taskForm.get(key);
      console.log(`  - ${key}: valid=${control?.valid}, value=${control?.value}, errors=`, control?.errors);
    });
  }
}

  updateTaskStatus(task: Task, newStatus: string): void {
    console.log('🔄 TaskBoard: Updating task status:', task.id, 'to:', newStatus);
    const updatedTask = { 
      ...task, 
      status: newStatus as Task['status'], 
      updatedAt: new Date() 
    };
    this.taskUpdated.emit(updatedTask);
  }

  addComment(): void {
    if (this.commentForm.valid && this.selectedTask) {
      const newComment: Comment = {
        id: 'comment-' + Date.now(),
        author: this.currentUserRole === 'client' ? this.projectClientName : this.projectFreelancerName,
        authorRole: this.currentUserRole,
        content: this.commentForm.value.content,
        timestamp: new Date()
      };

      const updatedTask = {
        ...this.selectedTask,
        comments: [...this.selectedTask.comments, newComment],
        updatedAt: new Date()
      };

      this.taskUpdated.emit(updatedTask);
      this.commentForm.reset();
    }
  }

  // ✅ Updated to handle 'urgent' priority
  getPriorityColor(priority: string): string {
    switch (priority) {
      case 'urgent': return 'text-red-700 bg-red-200';
      case 'high': return 'text-red-600 bg-red-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  }

  formatDate(date: Date | null): string {
    if (!date) return 'No due date';
    return new Date(date).toLocaleDateString();
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  canManageTasks(): boolean {
    return this.currentUserRole === 'client';
  }

  onDragStart(event: DragEvent, task: Task): void {
    event.dataTransfer?.setData('text/plain', task.id);
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
  }

  onDrop(event: DragEvent, status: string): void {
    event.preventDefault();
    const taskId = event.dataTransfer?.getData('text/plain');
    const task = this.tasks.find(t => t.id === taskId);
    
    if (task && task.status !== status) {
      this.updateTaskStatus(task, status);
    }
  }

  // ✅ Helper methods for new fields
  getEstimatedHoursDisplay(hours: number | null): string {
    return hours ? `${hours}h` : 'Not set';
  }

  getActualHoursDisplay(hours: number | null): string {
    return hours ? `${hours}h` : 'Not tracked';
  }

  isTaskOverdue(task: Task): boolean {
    return task.isOverdue || false;
  }

  isTaskCompleted(task: Task): boolean {
    return task.isCompleted || task.status === 'done';
  }
}