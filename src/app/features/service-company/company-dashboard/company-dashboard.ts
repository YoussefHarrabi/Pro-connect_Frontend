import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { Subject, takeUntil } from 'rxjs';
import { SharedNavbar, NavbarConfig } from '../../../shared/components/shared-navbar/shared-navbar';
import { SharedFooter } from '../../../shared/components/shared-footer/shared-footer';
import { ProjectService, ProjectDto, ProjectStatus, ProjectCategory } from '../../../shared/services/project.service';
import { TaskService, TaskDto, TaskStatus } from '../../../shared/services/task.service';
import { AuthService } from '../../../core/services/auth';

interface ProjectTask {
  id: number;
  title: string;
  status: TaskStatus;
  estimatedHours: number;
  actualHours: number;
  dueDate: Date | null;
  isCompleted: boolean;
  isOverdue: boolean;
}

interface OngoingProject {
  projectId: number;
  title: string;
  description: string;
  client: string;
  status: string;
  progress: number;
  deadline: Date | null;
  budget: number;
  isOverdue: boolean;
  category: string;
  timeline: string;
  daysRemaining: number;
  budgetRange: string;
  // ✅ Enhanced progress tracking fields
  totalTasks: number;
  completedTasks: number;
  totalEstimatedHours: number;
  completedEstimatedHours: number;
  actualHoursSpent: number;
  progressDetails: {
    formula: string;
    calculation: string;
    percentage: number;
  };
}

interface DashboardStats {
  ongoingProjects: number;
  completedProjects: number;
  totalRevenue: number;
  averageRating: number;
  projectsThisMonth: number;
  overdueProjects: number;
  totalHoursWorked: number;
  averageProjectProgress: number;
}

@Component({
  selector: 'app-company-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    TranslateModule,
    SharedNavbar,
    SharedFooter
  ],
  templateUrl: './company-dashboard.html',
  styleUrls: ['./company-dashboard.scss']
})
export class CompanyDashboard implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  // ✅ Enhanced state management for Service Company
  isLoading = true;
  currentUser: any = null;
  ongoingProjects: OngoingProject[] = [];
  recentProjects: OngoingProject[] = [];
  projectTasks: Map<number, ProjectTask[]> = new Map();
  
  stats: DashboardStats = {
    ongoingProjects: 0,
    completedProjects: 0,
    totalRevenue: 0,
    averageRating: 0,
    projectsThisMonth: 0,
    overdueProjects: 0,
    totalHoursWorked: 0,
    averageProjectProgress: 0
  };
  
  // ✅ Current UTC time
  private readonly CURRENT_UTC_TIME = new Date('2025-08-13T21:50:39Z');
  
  // ✅ Enhanced navbar config for Service Company
  navbarConfig: NavbarConfig = {
    title: 'Pro-Connect Service Company Dashboard',
    showLanguageToggle: true,
    showProfileLink: true,
    showLogoutButton: true,
    customButtons: [
      {
        label: 'Find Projects',
        route: '/project-discovery',
        class: 'text-primary-600 hover:text-primary-700'
      },
      {
        label: 'My Applications',
        route: '/my-applications',
        class: 'text-gray-600 hover:text-gray-700'
      },
      {
        label: 'Company Profile',
        route: '/company-profile',
        class: 'text-purple-600 hover:text-purple-700'
      }
    ]
  };

  constructor(
    private router: Router,
    private projectService: ProjectService,
    private taskService: TaskService,
    private authService: AuthService
  ) {}

  async ngOnInit(): Promise<void> {
    console.log('🚀 CompanyDashboard: Initializing for Service Company');
    console.log('⏰ Current UTC Time:', this.CURRENT_UTC_TIME.toISOString());
    
    try {
      this.currentUser = this.authService.getCurrentUser();
      console.log('👤 Current user (Service Company):', this.currentUser?.username);
      
      if (!this.currentUser?.username) {
        console.error('❌ No authenticated user found, redirecting to login');
        this.router.navigate(['/auth/login']);
        return;
      }
      
      await this.loadDashboardData();
    } catch (error) {
      console.error('❌ Error loading service company dashboard:', error);
    } finally {
      this.isLoading = false;
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ✅ Enhanced data loading for Service Company (same as freelancer - gets assigned projects)
  private async loadDashboardData(): Promise<void> {
    console.log('📊 Loading service company dashboard data...');
    
    try {
      // ✅ Load projects where Service Company is assigned as talent
      this.projectService.getAssignedProjects()
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: async (assignedProjects) => {
            console.log('📋 Projects assigned to Service Company:', assignedProjects.length);
            
            // ✅ Load tasks for each project to calculate accurate progress
            await this.loadTasksForProjects(assignedProjects);
            
            this.processOngoingProjects(assignedProjects);
            this.calculateEnhancedStats(assignedProjects);
          },
          error: (error) => {
            console.error('❌ Error loading assigned projects for Service Company:', error);
            this.ongoingProjects = [];
            this.stats = this.getEmptyStats();
          }
        });

      // ✅ Load assigned project stats from backend
      this.projectService.getAssignedProjectStats()
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (backendStats) => {
            console.log('📊 Backend stats for Service Company:', backendStats);
            
            // ✅ Merge backend stats with calculated stats
            this.stats = {
              ...this.stats,
              ongoingProjects: backendStats.ongoingProjects || this.stats.ongoingProjects,
              completedProjects: backendStats.completedProjects || this.stats.completedProjects,
              totalRevenue: backendStats.totalEarnings || this.stats.totalRevenue,
              averageRating: backendStats.averageRating || 4.6,
              projectsThisMonth: backendStats.projectsThisMonth || this.stats.projectsThisMonth,
              overdueProjects: backendStats.overdueProjects || this.stats.overdueProjects
            };
            
            console.log('✅ Stats updated from backend for Service Company:', this.stats);
          },
          error: (error) => {
            console.log('ℹ️ Assigned project stats endpoint not available, using calculated stats');
          }
        });
        
    } catch (error) {
      console.error('❌ Error in loadDashboardData for Service Company:', error);
      this.ongoingProjects = [];
      this.stats = this.getEmptyStats();
    }
  }

  // ✅ Load tasks for all projects to calculate progress
  private async loadTasksForProjects(projects: ProjectDto[]): Promise<void> {
    console.log('📋 Loading tasks for Service Company progress calculation...');
    
    const taskLoadPromises = projects.map(project => 
      this.taskService.getProjectTasks(project.id)
        .pipe(takeUntil(this.destroy$))
        .toPromise()
        .then(tasks => {
          if (tasks) {
            const projectTasks = tasks.map(task => this.mapToProjectTask(task));
            this.projectTasks.set(project.id, projectTasks);
            console.log(`📋 Loaded ${projectTasks.length} tasks for Service Company project ${project.id} (${project.title})`);
            
            // ✅ Log task details for debugging
            projectTasks.forEach(task => {
              console.log(`  - Task: "${task.title}" | Status: ${task.status} | Est: ${task.estimatedHours}h | Completed: ${task.isCompleted}`);
            });
          }
          return { projectId: project.id, tasks: tasks || [] };
        })
        .catch(error => {
          console.error(`❌ Error loading tasks for Service Company project ${project.id}:`, error);
          this.projectTasks.set(project.id, []);
          return { projectId: project.id, tasks: [] };
        })
    );

    try {
      await Promise.all(taskLoadPromises);
      console.log('✅ All Service Company project tasks loaded for progress calculation');
    } catch (error) {
      console.error('❌ Error loading Service Company project tasks:', error);
    }
  }

  // ✅ Map backend task to ProjectTask interface
  private mapToProjectTask(task: TaskDto): ProjectTask {
    const dueDate = task.dueDate ? new Date(task.dueDate) : null;
    const isOverdue = dueDate ? dueDate < this.CURRENT_UTC_TIME : false;
    const isCompleted = task.status === TaskStatus.DONE || task.isCompleted;
    
    return {
      id: task.id,
      title: task.title,
      status: task.status,
      estimatedHours: task.estimatedHours || 0,
      actualHours: task.actualHours || 0,
      dueDate: dueDate,
      isCompleted: isCompleted,
      isOverdue: isOverdue
    };
  }

  // ✅ Enhanced project processing with task-based progress
  private processOngoingProjects(projects: ProjectDto[]): void {
    console.log('🔄 Processing Service Company projects with estimated hours-based progress:', projects.length);
    
    this.ongoingProjects = projects
      .filter(project => 
        project.status === ProjectStatus.IN_PROGRESS || 
        project.status === ProjectStatus.OPEN
      )
      .map(project => this.mapProjectToOngoing(project))
      .sort((a, b) => {
        // Sort by overdue first, then by progress (lowest first), then by deadline
        if (a.isOverdue !== b.isOverdue) {
          return a.isOverdue ? -1 : 1;
        }
        if (Math.abs(a.progress - b.progress) > 5) {
          return a.progress - b.progress; // Lower progress first (needs attention)
        }
        return a.daysRemaining - b.daysRemaining;
      });

    // ✅ Get recent projects (last 5)
    this.recentProjects = this.ongoingProjects.slice(0, 5);
    
    console.log('✅ Service Company ongoing projects processed with estimated hours-based progress:', this.ongoingProjects.length);
    console.log('✅ Recent Service Company projects:', this.recentProjects.length);
  }

  // ✅ Enhanced project mapping with estimated hours-based progress calculation
  private mapProjectToOngoing(project: ProjectDto): OngoingProject {
    const deadline = project.deadline ? new Date(project.deadline) : null;
    const isOverdue = deadline ? deadline < this.CURRENT_UTC_TIME : false;
    
    // Calculate days remaining
    let daysRemaining = 0;
    if (deadline) {
      const diffTime = deadline.getTime() - this.CURRENT_UTC_TIME.getTime();
      daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }
    
    // ✅ Get tasks for this project
    const projectTasks = this.projectTasks.get(project.id) || [];
    
    // ✅ Calculate progress based on estimated hours of completed tasks
    const progressCalculation = this.calculateEstimatedHoursProgress(project, projectTasks);
    
    return {
      projectId: project.id,
      title: project.title,
      description: project.description,
      client: project.clientUsername || 'Unknown Client',
      status: project.status,
      progress: progressCalculation.percentage,
      deadline: deadline,
      budget: (project.budgetMin + project.budgetMax) / 2,
      budgetRange: this.projectService.formatBudgetRange(project),
      isOverdue,
      category: this.projectService.getCategoryLabel(project.category),
      timeline: this.projectService.getTimelineLabel(project.timeline),
      daysRemaining: Math.max(daysRemaining, 0),
      // ✅ Enhanced progress tracking
      totalTasks: projectTasks.length,
      completedTasks: projectTasks.filter(t => t.isCompleted).length,
      totalEstimatedHours: projectTasks.reduce((sum, t) => sum + t.estimatedHours, 0),
      completedEstimatedHours: projectTasks.filter(t => t.isCompleted).reduce((sum, t) => sum + t.estimatedHours, 0),
      actualHoursSpent: projectTasks.reduce((sum, t) => sum + t.actualHours, 0),
      progressDetails: progressCalculation
    };
  }

  // ✅ Progress calculation based on estimated hours of completed tasks
  private calculateEstimatedHoursProgress(project: ProjectDto, tasks: ProjectTask[]): any {
    console.log(`📊 Calculating estimated hours progress for Service Company project: ${project.title}`);
    console.log(`📋 Tasks available: ${tasks.length}`);
    
    if (tasks.length === 0) {
      // Fallback to status-based progress if no tasks
      const statusProgress = this.getStatusBasedProgress(project.status);
      console.log(`📋 No tasks found, using status-based progress: ${statusProgress}%`);
      
      return {
        formula: 'Status-based (no tasks)',
        calculation: `Status: ${project.status}`,
        percentage: statusProgress
      };
    }
    
    // ✅ Calculate total estimated hours for all tasks
    const totalEstimatedHours = tasks.reduce((sum, task) => sum + task.estimatedHours, 0);
    
    // ✅ Calculate estimated hours for completed tasks only
    const completedTasks = tasks.filter(task => task.isCompleted);
    const completedEstimatedHours = completedTasks.reduce((sum, task) => sum + task.estimatedHours, 0);
    
    console.log(`📊 Progress calculation for Service Company project ${project.title}:`);
    console.log(`  - Total tasks: ${tasks.length}`);
    console.log(`  - Completed tasks: ${completedTasks.length}`);
    console.log(`  - Total estimated hours: ${totalEstimatedHours}h`);
    console.log(`  - Completed estimated hours: ${completedEstimatedHours}h`);
    
    let progress = 0;
    let formula = '';
    let calculation = '';
    
    if (totalEstimatedHours > 0) {
      // ✅ Use same formula: (completedEstimatedHours * 100) / totalEstimatedHours
      progress = Math.round((completedEstimatedHours * 100) / totalEstimatedHours);
      formula = '(Completed Estimated Hours × 100) ÷ Total Estimated Hours';
      calculation = `(${completedEstimatedHours} × 100) ÷ ${totalEstimatedHours} = ${progress}%`;
    } else {
      // All tasks have 0 estimated hours - use task count instead
      const taskProgress = tasks.length > 0 ? Math.round((completedTasks.length * 100) / tasks.length) : 0;
      progress = taskProgress;
      formula = 'Task Count (no time estimates)';
      calculation = `${completedTasks.length}/${tasks.length} tasks = ${progress}%`;
    }
    
    // ✅ Apply status constraints
    const constrainedProgress = this.applyStatusConstraints(progress, project.status);
    
    const result = {
      formula,
      calculation,
      percentage: constrainedProgress
    };
    
    console.log(`📊 Final progress for Service Company project ${project.title}:`, result);
    
    return result;
  }

  // ✅ Status-based fallback progress
  private getStatusBasedProgress(status: string): number {
    switch (status) {
      case ProjectStatus.OPEN:
        return 0;
      case ProjectStatus.IN_PROGRESS:
        return 25; // Reasonable assumption for started projects
      case ProjectStatus.COMPLETED:
        return 100;
      default:
        return 0;
    }
  }

  // ✅ Apply status constraints to progress
  private applyStatusConstraints(progress: number, status: string): number {
    switch (status) {
      case ProjectStatus.OPEN:
        return Math.min(progress, 5); // Max 5% for open projects
      case ProjectStatus.IN_PROGRESS:
        return Math.max(Math.min(progress, 95), 5); // 5-95% for in-progress
      case ProjectStatus.COMPLETED:
        return 100;
      default:
        return Math.max(Math.min(progress, 100), 0);
    }
  }

  // ✅ Enhanced statistics calculation for Service Company
  private calculateEnhancedStats(projects: ProjectDto[]): void {
    console.log('📊 Calculating enhanced stats for Service Company...');
    
    const now = this.CURRENT_UTC_TIME;
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    // Filter projects by status
    const completedProjects = projects.filter(p => p.status === ProjectStatus.COMPLETED);
    const ongoingProjects = projects.filter(p => 
      p.status === ProjectStatus.IN_PROGRESS || p.status === ProjectStatus.OPEN
    );
    const overdueProjects = ongoingProjects.filter(p => {
      if (!p.deadline) return false;
      return new Date(p.deadline) < now;
    });
    const thisMonthProjects = projects.filter(p => 
      new Date(p.createdAt) >= thisMonth
    );
    
    // ✅ Calculate total hours worked across all projects
    let totalHoursWorked = 0;
    let totalProgressSum = 0;
    
    projects.forEach(project => {
      const projectTasks = this.projectTasks.get(project.id) || [];
      totalHoursWorked += projectTasks.reduce((sum, t) => sum + t.actualHours, 0);
    });
    
    // Calculate average project progress
    if (this.ongoingProjects.length > 0) {
      totalProgressSum = this.ongoingProjects.reduce((sum, p) => sum + p.progress, 0);
    }
    
    this.stats = {
      ongoingProjects: ongoingProjects.length,
      completedProjects: completedProjects.length,
      totalRevenue: completedProjects.reduce((sum, p) => sum + ((p.budgetMin + p.budgetMax) / 2), 0),
      averageRating: 4.6, // Mock rating for Service Company
      projectsThisMonth: thisMonthProjects.length,
      overdueProjects: overdueProjects.length,
      totalHoursWorked: Math.round(totalHoursWorked * 10) / 10,
      averageProjectProgress: this.ongoingProjects.length > 0 ? 
        Math.round(totalProgressSum / this.ongoingProjects.length) : 0
    };
    
    console.log('✅ Enhanced stats calculated for Service Company:', this.stats);
  }

  // ✅ Get empty stats structure
  private getEmptyStats(): DashboardStats {
    return {
      ongoingProjects: 0,
      completedProjects: 0,
      totalRevenue: 0,
      averageRating: 0,
      projectsThisMonth: 0,
      overdueProjects: 0,
      totalHoursWorked: 0,
      averageProjectProgress: 0
    };
  }

  // ✅ Navigation methods
  navigateToWorkspace(projectId: number): void {
    console.log('🔗 Navigating to workspace for Service Company project:', projectId);
    this.router.navigate(['/workspace', projectId]);
  }

  navigateToProjectDiscovery(): void {
    console.log('🔗 Navigating to project discovery for Service Company');
    this.router.navigate(['/project-discovery']);
  }

  navigateToMyApplications(): void {
    console.log('🔗 Navigating to applications for Service Company');
    this.router.navigate(['/my-applications']);
  }

  navigateToCompanyProfile(): void {
    console.log('🔗 Navigating to company profile');
    this.router.navigate(['/company-profile']);
  }

  // ✅ Enhanced UI helper methods
  getStatusBadgeClass(status: string): string {
    switch (status) {
      case ProjectStatus.IN_PROGRESS:
        return 'bg-blue-100 text-blue-800';
      case ProjectStatus.OPEN:
        return 'bg-yellow-100 text-yellow-800';
      case ProjectStatus.COMPLETED:
        return 'bg-green-100 text-green-800';
      case ProjectStatus.CLOSED:
        return 'bg-gray-100 text-gray-800';
      case ProjectStatus.CANCELLED:
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  getStatusLabel(status: string): string {
    return this.projectService.getProjectStatusLabel(status as ProjectStatus);
  }

  formatDeadline(deadline: Date | null): string {
    if (!deadline) return 'No deadline';
    
    const now = this.CURRENT_UTC_TIME;
    const diffTime = deadline.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return `${Math.abs(diffDays)} days overdue`;
    } else if (diffDays === 0) {
      return 'Due today';
    } else if (diffDays === 1) {
      return 'Due tomorrow';
    } else if (diffDays <= 7) {
      return `${diffDays} days remaining`;
    } else if (diffDays <= 30) {
      const weeks = Math.ceil(diffDays / 7);
      return `${weeks} week${weeks > 1 ? 's' : ''} remaining`;
    } else {
      const months = Math.ceil(diffDays / 30);
      return `${months} month${months > 1 ? 's' : ''} remaining`;
    }
  }

  getUrgencyClass(project: OngoingProject): string {
    if (project.isOverdue) return 'border-l-4 border-red-500';
    if (project.progress < 30 && project.daysRemaining <= 7) return 'border-l-4 border-red-400';
    if (project.daysRemaining <= 3) return 'border-l-4 border-yellow-500';
    if (project.daysRemaining <= 7) return 'border-l-4 border-blue-500';
    return 'border-l-4 border-gray-200';
  }

  getProgressColor(progress: number): string {
    if (progress >= 80) return 'bg-green-600';
    if (progress >= 60) return 'bg-blue-600';
    if (progress >= 40) return 'bg-yellow-600';
    if (progress >= 20) return 'bg-orange-500';
    return 'bg-red-500';
  }

  // ✅ Enhanced progress display
  getProgressTooltip(project: OngoingProject): string {
    return `Progress Calculation:\n` +
           `${project.progressDetails.formula}\n` +
           `${project.progressDetails.calculation}\n\n` +
           `Tasks: ${project.completedTasks}/${project.totalTasks}\n` +
           `Estimated Hours: ${project.completedEstimatedHours}h/${project.totalEstimatedHours}h\n` +
           `Actual Hours Spent: ${project.actualHoursSpent}h`;
  }

  // ✅ Refresh data
  refreshDashboard(): void {
    console.log('🔄 Refreshing Service Company dashboard data...');
    this.isLoading = true;
    this.projectTasks.clear();
    this.loadDashboardData().finally(() => {
      this.isLoading = false;
    });
  }

  // ✅ Quick action methods
  markProjectCompleted(projectId: number, event: Event): void {
    event.stopPropagation();
    
    console.log('✅ Marking project as completed:', projectId);
    
    this.projectService.completeProject(projectId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          console.log('✅ Project marked as completed by Service Company');
          this.refreshDashboard();
        },
        error: (error) => {
          console.error('❌ Error completing project for Service Company:', error);
          alert('Error completing project: ' + error.message);
        }
      });
  }

  // ✅ Get current time info
  getCurrentTimeInfo(): string {
    const now = this.CURRENT_UTC_TIME;
    const timeString = now.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true,
      timeZone: 'UTC'
    });
    const dateString = now.toLocaleDateString('en-US', { 
      weekday: 'long',
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      timeZone: 'UTC'
    });
    return `${dateString} at ${timeString} UTC`;
  }

  // ✅ Service Company efficiency metrics
  getProjectEfficiency(project: OngoingProject): string {
    if (project.totalEstimatedHours === 0) return 'No time estimates';
    if (project.actualHoursSpent === 0) return 'Not started';
    
    const efficiency = (project.completedEstimatedHours / project.actualHoursSpent) * 100;
    if (efficiency > 120) return 'Highly efficient';
    if (efficiency > 100) return 'Ahead of estimate';
    if (efficiency > 80) return 'On track';
    if (efficiency > 60) return 'Slightly behind';
    return 'Needs attention';
  }
}