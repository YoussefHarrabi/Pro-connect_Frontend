import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { Subject, takeUntil, forkJoin } from 'rxjs';
import { BaseChartDirective } from 'ng2-charts';
import { Chart, ChartConfiguration, ChartData, ChartType, registerables } from 'chart.js';
import { AdminSidebar } from '../components/admin-sidebar/admin-sidebar';
import { AuthService } from '../../../core/services/auth';
import { AdminUserService, UserStatisticsDto } from '../../../shared/services/admin-user.service';
import { ProjectService, ProjectDto, ProjectStatus } from '../../../shared/services/project.service';

// Register Chart.js components
Chart.register(...registerables);

interface AdminStats {
  totalUsers: number;
  verifiedUsers: number;
  pendingVerification: number;
  activeThisMonth: number;
  totalProjects: number;
  openProjects: number;
  inProgressProjects: number;
  completedProjects: number;
  totalApplications: number;
  totalRevenue: number;
  newUsersThisMonth: number;
  completedProjectsThisMonth: number;
  pendingApplications: number;
}

interface ProjectStatistics {
  totalProjects: number;
  openProjects: number;
  inProgressProjects: number;
  completedProjects: number;
  cancelledProjects: number;
  totalBudget: number;
  averageBudget: number;
  totalApplications: number;
}

interface RecentActivity {
  id: string;
  type: 'user_registered' | 'project_created' | 'project_completed' | 'application_submitted';
  message: string;
  timestamp: Date;
  user?: string;
}

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    TranslateModule,
    AdminSidebar,
    BaseChartDirective
  ],
  templateUrl: './admin-dashboard.html',
  styleUrls: ['./admin-dashboard.scss']
})
export class AdminDashboard implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  isLoading = true;
  isSidebarCollapsed = false;
  activeMenuItem = 'dashboard';
  
  stats: AdminStats = {
    totalUsers: 0,
    verifiedUsers: 0,
    pendingVerification: 0,
    activeThisMonth: 0,
    totalProjects: 0,
    openProjects: 0,
    inProgressProjects: 0,
    completedProjects: 0,
    totalApplications: 0,
    totalRevenue: 0,
    newUsersThisMonth: 0,
    completedProjectsThisMonth: 0,
    pendingApplications: 0
  };

  userStatistics: UserStatisticsDto | null = null;
  projectStatistics: ProjectStatistics | null = null;

  // Chart configurations
  userGrowthChartData: ChartData<'line'> = {
    labels: [],
    datasets: []
  };
  
  userGrowthChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1
        }
      }
    },
    plugins: {
      legend: {
        display: true,
        position: 'top'
      }
    }
  };

  projectStatusChartData: ChartData<'doughnut'> = {
    labels: [],
    datasets: []
  };
  
  projectStatusChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'right'
      }
    }
  };

  userGrowthChartType: ChartType = 'line';
  projectStatusChartType: ChartType = 'doughnut';
  recentActivities: RecentActivity[] = [];

  constructor(
    private router: Router,
    private authService: AuthService,
    private adminUserService: AdminUserService,
    private projectService: ProjectService
  ) {}

  async ngOnInit(): Promise<void> {
    try {
      await this.loadDashboardData();
    } catch (error) {
      console.error('Error loading admin dashboard:', error);
    } finally {
      this.isLoading = false;
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private async loadDashboardData(): Promise<void> {
    try {
      // Mock data - in real app this would come from admin services
      await this.loadStats();
      await this.loadRecentActivities();
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    }
  }

  private async loadStats(): Promise<void> {
    console.log('📊 Loading admin dashboard statistics...');
    
    try {
      // Load both user and project statistics simultaneously
      forkJoin({
        userStats: this.adminUserService.getUserStatistics(),
        projects: this.projectService.getAllOpenProjects()
      }).pipe(takeUntil(this.destroy$))
      .subscribe({
        next: ({ userStats, projects }) => {
          console.log('✅ User statistics loaded:', userStats);
          console.log('✅ Projects loaded:', projects.length);
          
          // Store raw statistics
          this.userStatistics = userStats;
          this.projectStatistics = this.calculateProjectStatistics(projects);
          
          // Combine into admin stats
          this.stats = {
            totalUsers: userStats.totalUsers,
            verifiedUsers: userStats.verifiedUsers,
            pendingVerification: userStats.pendingVerification,
            activeThisMonth: userStats.activeThisMonth,
            totalProjects: this.projectStatistics.totalProjects,
            openProjects: this.projectStatistics.openProjects,
            inProgressProjects: this.projectStatistics.inProgressProjects,
            completedProjects: this.projectStatistics.completedProjects,
            totalApplications: this.projectStatistics.totalApplications,
            totalRevenue: this.projectStatistics.totalBudget,
            newUsersThisMonth: userStats.activeThisMonth, // Use activeThisMonth as proxy for new users
            completedProjectsThisMonth: this.calculateCompletedThisMonth(projects),
            pendingApplications: this.projectStatistics.totalApplications // Assuming all applications are pending
          };
          
          console.log('✅ Combined admin statistics:', this.stats);
          
          // Initialize charts with loaded data
          this.initializeUserGrowthChart();
          this.initializeProjectStatusChart();
        },
        error: (error: any) => {
          console.error('❌ Error loading statistics:', error);
          // Fallback to mock data
          this.loadMockStats();
        }
      });
    } catch (error) {
      console.error('❌ Error in loadStats:', error);
      this.loadMockStats();
    }
  }

  private calculateProjectStatistics(projects: ProjectDto[]): ProjectStatistics {
    const stats: ProjectStatistics = {
      totalProjects: projects.length,
      openProjects: 0,
      inProgressProjects: 0,
      completedProjects: 0,
      cancelledProjects: 0,
      totalBudget: 0,
      averageBudget: 0,
      totalApplications: 0
    };

    projects.forEach(project => {
      // Count projects by status
      switch (project.status) {
        case ProjectStatus.OPEN:
          stats.openProjects++;
          break;
        case ProjectStatus.IN_PROGRESS:
          stats.inProgressProjects++;
          break;
        case ProjectStatus.COMPLETED:
          stats.completedProjects++;
          break;
        case ProjectStatus.CANCELLED:
          stats.cancelledProjects++;
          break;
      }

      // Calculate budget totals (using average of min/max)
      const projectBudget = (project.budgetMin + project.budgetMax) / 2;
      stats.totalBudget += projectBudget;
      
      // Sum applications
      stats.totalApplications += project.applicationCount || 0;
    });

    // Calculate average budget
    stats.averageBudget = stats.totalProjects > 0 ? stats.totalBudget / stats.totalProjects : 0;

    return stats;
  }

  private calculateCompletedThisMonth(projects: ProjectDto[]): number {
    const thisMonth = new Date();
    thisMonth.setDate(1); // First day of current month
    
    return projects.filter(project => {
      if (project.status !== ProjectStatus.COMPLETED) return false;
      
      // Check if updated date (completion) is this month
      const updatedDate = new Date(project.updatedAt);
      return updatedDate >= thisMonth;
    }).length;
  }

  private loadMockStats(): void {
    console.log('📝 Loading mock statistics for development');
    // Mock statistics fallback
    this.stats = {
      totalUsers: 1247,
      verifiedUsers: 1098,
      pendingVerification: 149,
      activeThisMonth: 234,
      totalProjects: 89,
      openProjects: 23,
      inProgressProjects: 34,
      completedProjects: 28,
      totalApplications: 456,
      totalRevenue: 125000,
      newUsersThisMonth: 23,
      completedProjectsThisMonth: 12,
      pendingApplications: 18
    };

    // Mock project statistics for charts
    this.projectStatistics = {
      totalProjects: 89,
      openProjects: 23,
      inProgressProjects: 34,
      completedProjects: 28,
      cancelledProjects: 4,
      totalBudget: 125000,
      averageBudget: 1404,
      totalApplications: 456
    };

    // Initialize charts with mock data
    this.initializeUserGrowthChart();
    this.initializeProjectStatusChart();
  }

  private async loadRecentActivities(): Promise<void> {
    // Mock recent activities - replace with actual admin service calls
    this.recentActivities = [
      {
        id: '1',
        type: 'user_registered',
        message: 'New freelancer John Doe registered',
        timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
        user: 'John Doe'
      },
      {
        id: '2',
        type: 'project_created',
        message: 'New project "E-commerce Website" was created',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
        user: 'TechCorp Inc.'
      },
      {
        id: '3',
        type: 'project_completed',
        message: 'Project "Mobile App Design" was completed',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4), // 4 hours ago
        user: 'Sarah Wilson'
      },
      {
        id: '4',
        type: 'application_submitted',
        message: 'New application submitted for "Web Development"',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 6), // 6 hours ago
        user: 'Mike Johnson'
      },
      {
        id: '5',
        type: 'user_registered',
        message: 'New service company DevExperts registered',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 8), // 8 hours ago
        user: 'DevExperts'
      }
    ];
  }

  onSidebarItemSelected(itemId: string): void {
    this.activeMenuItem = itemId;
  }

  onSidebarToggle(): void {
    this.isSidebarCollapsed = !this.isSidebarCollapsed;
  }

  navigateToUserManagement(): void {
    this.router.navigate(['/admin/users']);
  }

  navigateToProjectManagement(): void {
    this.router.navigate(['/admin/projects']);
  }

  // Chart initialization methods
  private initializeUserGrowthChart(): void {
    // Generate sample user growth data for the last 6 months
    const months = this.generateLastSixMonths();
    const userData = this.generateUserGrowthData();
    
    this.userGrowthChartData = {
      labels: months,
      datasets: [
        {
          label: 'Total Users',
          data: userData.totalUsers,
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          tension: 0.4,
          fill: true
        },
        {
          label: 'Verified Users',
          data: userData.verifiedUsers,
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          tension: 0.4,
          fill: true
        }
      ]
    };
  }

  private initializeProjectStatusChart(): void {
    if (!this.projectStatistics) return;

    const labels = ['Open', 'In Progress', 'Completed', 'Cancelled'];
    const data = [
      this.projectStatistics.openProjects,
      this.projectStatistics.inProgressProjects,
      this.projectStatistics.completedProjects,
      this.projectStatistics.cancelledProjects
    ];

    this.projectStatusChartData = {
      labels: labels,
      datasets: [
        {
          label: 'Projects',
          data: data,
          backgroundColor: [
            '#3b82f6', // Blue for Open
            '#f59e0b', // Amber for In Progress  
            '#10b981', // Green for Completed
            '#ef4444'  // Red for Cancelled
          ],
          borderWidth: 2,
          borderColor: '#ffffff'
        }
      ]
    };
  }

  private generateLastSixMonths(): string[] {
    const months = [];
    const currentDate = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      months.push(date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }));
    }
    
    return months;
  }

  private generateUserGrowthData(): { totalUsers: number[], verifiedUsers: number[] } {
    // Generate realistic growth data based on current statistics
    const baseUsers = this.stats.totalUsers || 100;
    const baseVerified = this.stats.verifiedUsers || 80;
    
    const totalUsers = [];
    const verifiedUsers = [];
    
    for (let i = 0; i < 6; i++) {
      // Simulate steady growth
      const growthFactor = 0.85 + (i * 0.05); // 85% to 110% growth
      totalUsers.push(Math.round(baseUsers * growthFactor));
      verifiedUsers.push(Math.round(baseVerified * growthFactor));
    }
    
    return { totalUsers, verifiedUsers };
  }

  getActivityIcon(type: string): string {
    switch (type) {
      case 'user_registered':
        return 'fas fa-user-plus text-green-600';
      case 'project_created':
        return 'fas fa-folder-plus text-blue-600';
      case 'project_completed':
        return 'fas fa-check-circle text-green-600';
      case 'application_submitted':
        return 'fas fa-file-alt text-yellow-600';
      default:
        return 'fas fa-info-circle text-gray-600';
    }
  }

  getActivityTypeLabel(type: string): string {
    switch (type) {
      case 'user_registered':
        return 'User Registration';
      case 'project_created':
        return 'Project Created';
      case 'project_completed':
        return 'Project Completed';
      case 'application_submitted':
        return 'Application Submitted';
      default:
        return 'Activity';
    }
  }

  formatTimeAgo(timestamp: Date): string {
    const now = new Date();
    const diffTime = now.getTime() - timestamp.getTime();
    const diffMinutes = Math.floor(diffTime / (1000 * 60));
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffMinutes < 60) {
      return `${diffMinutes} minutes ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hours ago`;
    } else {
      return `${diffDays} days ago`;
    }
  }
}
