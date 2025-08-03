import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

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

@Component({
  selector: 'app-task-board',
  standalone: true,
  imports: [CommonModule, TranslateModule, ReactiveFormsModule],
  templateUrl: './task-board.html',
  styleUrls: ['./task-board.scss']
})
export class TaskBoardComponent {
  @Input() tasks: Task[] = [];
  @Input() currentUserRole: 'client' | 'freelancer' = 'client';
  @Output() taskUpdated = new EventEmitter<Task>();
  @Output() taskCreated = new EventEmitter<Omit<Task, 'id' | 'createdAt' | 'updatedAt'>>();

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
    this.taskForm = this.fb.group({
      title: ['', Validators.required],
      description: ['', Validators.required],
      priority: ['medium', Validators.required],
      dueDate: ['', Validators.required],
      assignee: ['', Validators.required]
    });

    this.commentForm = this.fb.group({
      content: ['', Validators.required]
    });
  }

  getTasksByStatus(status: string): Task[] {
    return this.tasks.filter(task => task.status === status);
  }

  openTaskModal(): void {
    this.showTaskModal = true;
    this.taskForm.reset();
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

  createTask(): void {
    if (this.taskForm.valid) {
      const newTask = {
        ...this.taskForm.value,
        status: 'todo',
        comments: [],
        attachments: []
      };
      this.taskCreated.emit(newTask);
      this.closeTaskModal();
    }
  }

  updateTaskStatus(task: Task, newStatus: string): void {
    const updatedTask = { ...task, status: newStatus as Task['status'], updatedAt: new Date() };
    this.taskUpdated.emit(updatedTask);
  }

  addComment(): void {
    if (this.commentForm.valid && this.selectedTask) {
      const newComment: Comment = {
        id: 'comment-' + Date.now(),
        author: this.currentUserRole === 'client' ? 'John Smith' : 'Sarah Johnson',
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
}
