import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { AdminSidebar } from '../components/admin-sidebar/admin-sidebar';
import { ProjectService, ProjectDto, ProjectStatus, ProjectCategory } from '../../../shared/services/project.service';

@Component({
  selector: 'app-project-management',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    TranslateModule,
    FormsModule,
    AdminSidebar
  ],
  templateUrl: './project-management.html',
  styleUrls: ['./project-management.scss']
})
export class ProjectManagement implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  isLoading = true;
  isSidebarCollapsed = false;
  activeMenuItem = 'projects';
  
  projects: ProjectDto[] = [];
  filteredProjects: ProjectDto[] = [];
  searchTerm = '';
  selectedStatus = '';
  selectedCategory = '';
  
  // Pagination
  currentPage = 0;
  itemsPerPage = 10;
  totalItems = 0;

  // Available filter options
  statuses = [
    { value: '', label: 'All Statuses' },
    { value: ProjectStatus.OPEN, label: 'Open' },
    { value: ProjectStatus.IN_PROGRESS, label: 'In Progress' },
    { value: ProjectStatus.COMPLETED, label: 'Completed' },
    { value: ProjectStatus.CANCELLED, label: 'Cancelled' },
    { value: ProjectStatus.CLOSED, label: 'Closed' }
  ];

  categories = [
    { value: '', label: 'All Categories' },
    { value: ProjectCategory.WEB_DEVELOPMENT, label: 'Web Development' },
    { value: ProjectCategory.MOBILE_DEVELOPMENT, label: 'Mobile Development' },
    { value: ProjectCategory.DESIGN_CREATIVE, label: 'Design & Creative' },
    { value: ProjectCategory.DATA_SCIENCE, label: 'Data Science' },
    { value: ProjectCategory.MARKETING_SALES, label: 'Marketing & Sales' },
    { value: ProjectCategory.OTHER, label: 'Other' }
  ];

  constructor(
    private router: Router,
    private projectService: ProjectService
  ) {}

  async ngOnInit(): Promise<void> {
    console.log('🚀 ProjectManagement: Initializing...');
    try {
      await this.loadProjects();
    } catch (error) {
      console.error('❌ Error loading projects:', error);
    } finally {
      this.isLoading = false;
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private async loadProjects(): Promise<void> {
    console.log('📋 Loading all projects from service...');
    
    try {
      // Use the ProjectService to get all projects
      this.projectService.getAllOpenProjects()
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (projects: ProjectDto[]) => {
            console.log('✅ Projects loaded successfully:', projects.length);
            this.projects = projects;
            this.totalItems = projects.length;
            this.applyFilters();
          },
          error: (error) => {
            console.error('❌ Error loading projects:', error);
            // Show some mock data if the API is not available
            this.loadMockData();
          }
        });
    } catch (error) {
      console.error('❌ Service error:', error);
      this.loadMockData();
    }
  }

  private loadMockData(): void {
    console.log('📋 Loading mock project data...');
    // Mock data for demonstration
    this.projects = [
      {
        id: 1,
        title: 'E-commerce Website Development',
        description: 'Build a modern e-commerce platform with React and Node.js',
        category: ProjectCategory.WEB_DEVELOPMENT,
        skills: ['React', 'Node.js', 'PostgreSQL'],
        projectType: 'FIXED' as any,
        budgetMin: 4500,
        budgetMax: 5500,
        currency: 'USD',
        budgetNegotiable: true,
        timeline: '3 months',
        complexity: 'INTERMEDIATE' as any,
        preferredTalentType: 'FREELANCER' as any,
        experienceLevel: 'INTERMEDIATE' as any,
        location: 'Remote',
        isRemote: true,
        isUrgent: false,
        isFeatured: true,
        deadline: '2024-12-15',
        status: ProjectStatus.IN_PROGRESS,
        clientUsername: 'techcorp_admin',
        assignedTalentUsername: 'sarah_dev',
        applicationCount: 12,
        createdAt: '2024-07-15T10:00:00Z',
        updatedAt: '2024-08-01T14:30:00Z'
      },
      {
        id: 2,
        title: 'Mobile App UI Design',
        description: 'Design modern UI/UX for a fitness tracking mobile app',
        category: ProjectCategory.DESIGN_CREATIVE,
        skills: ['Figma', 'UI Design', 'Mobile Design'],
        projectType: 'FIXED' as any,
        budgetMin: 2000,
        budgetMax: 3000,
        currency: 'USD',
        budgetNegotiable: false,
        timeline: '6 weeks',
        complexity: 'ENTRY' as any,
        preferredTalentType: 'FREELANCER' as any,
        experienceLevel: 'INTERMEDIATE' as any,
        isRemote: true,
        isUrgent: true,
        isFeatured: false,
        deadline: '2024-10-30',
        status: ProjectStatus.OPEN,
        clientUsername: 'healthtech_co',
        applicationCount: 8,
        createdAt: '2024-08-01T09:00:00Z',
        updatedAt: '2024-08-01T09:00:00Z'
      },
      {
        id: 3,
        title: 'Digital Marketing Campaign',
        description: 'Create and manage social media marketing campaign for product launch',
        category: ProjectCategory.MARKETING_SALES,
        skills: ['Social Media', 'Content Marketing', 'Analytics'],
        projectType: 'HOURLY' as any,
        budgetMin: 25,
        budgetMax: 40,
        currency: 'USD',
        budgetNegotiable: true,
        timeline: '2 months',
        complexity: 'INTERMEDIATE' as any,
        preferredTalentType: 'AGENCY' as any,
        experienceLevel: 'EXPERT' as any,
        isRemote: true,
        isUrgent: false,
        isFeatured: false,
        status: ProjectStatus.COMPLETED,
        clientUsername: 'startup_xyz',
        assignedTalentUsername: 'marketing_experts',
        applicationCount: 15,
        createdAt: '2024-06-10T11:00:00Z',
        updatedAt: '2024-08-10T16:00:00Z'
      }
    ];
    
    this.totalItems = this.projects.length;
    this.applyFilters();
  }

  onSearch(): void {
    this.currentPage = 0;
    this.applyFilters();
  }

  onStatusFilter(): void {
    this.currentPage = 0;
    this.applyFilters();
  }

  onCategoryFilter(): void {
    this.currentPage = 0;
    this.applyFilters();
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.selectedStatus = '';
    this.selectedCategory = '';
    this.currentPage = 0;
    this.applyFilters();
  }

  private applyFilters(): void {
    let filtered = [...this.projects];

    // Search filter
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(project => 
        project.title.toLowerCase().includes(term) ||
        project.description.toLowerCase().includes(term) ||
        project.clientUsername.toLowerCase().includes(term) ||
        (project.assignedTalentUsername && project.assignedTalentUsername.toLowerCase().includes(term))
      );
    }

    // Status filter
    if (this.selectedStatus) {
      filtered = filtered.filter(project => project.status === this.selectedStatus);
    }

    // Category filter
    if (this.selectedCategory) {
      filtered = filtered.filter(project => project.category === this.selectedCategory);
    }

    this.filteredProjects = filtered;
    this.totalItems = filtered.length;
  }

  get paginatedProjects(): ProjectDto[] {
    const start = this.currentPage * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    return this.filteredProjects.slice(start, end);
  }

  get totalPages(): number {
    return Math.ceil(this.totalItems / this.itemsPerPage);
  }

  onPageChange(page: number): void {
    if (page >= 0 && page < this.totalPages) {
      this.currentPage = page;
    }
  }

  onSidebarItemSelected(itemId: string): void {
    this.activeMenuItem = itemId;
  }

  onSidebarToggle(): void {
    this.isSidebarCollapsed = !this.isSidebarCollapsed;
  }

  getStatusBadgeClass(status: ProjectStatus): string {
    switch (status) {
      case ProjectStatus.OPEN: 
        return 'bg-blue-100 text-blue-800';
      case ProjectStatus.IN_PROGRESS: 
        return 'bg-yellow-100 text-yellow-800';
      case ProjectStatus.COMPLETED: 
        return 'bg-green-100 text-green-800';
      case ProjectStatus.CANCELLED: 
        return 'bg-red-100 text-red-800';
      case ProjectStatus.CLOSED: 
        return 'bg-gray-100 text-gray-800';
      default: 
        return 'bg-gray-100 text-gray-800';
    }
  }

  getCategoryLabel(category: ProjectCategory): string {
    const categoryLabels: { [key in ProjectCategory]: string } = {
      [ProjectCategory.WEB_DEVELOPMENT]: 'Web Development',
      [ProjectCategory.MOBILE_DEVELOPMENT]: 'Mobile Development',
      [ProjectCategory.DESKTOP_DEVELOPMENT]: 'Desktop Development',
      [ProjectCategory.DESIGN_CREATIVE]: 'Design & Creative',
      [ProjectCategory.DATA_SCIENCE]: 'Data Science',
      [ProjectCategory.MARKETING_SALES]: 'Marketing & Sales',
      [ProjectCategory.WRITING_TRANSLATION]: 'Writing & Translation',
      [ProjectCategory.BUSINESS_CONSULTING]: 'Business Consulting',
      [ProjectCategory.ENGINEERING_ARCHITECTURE]: 'Engineering & Architecture',
      [ProjectCategory.LEGAL]: 'Legal',
      [ProjectCategory.FINANCE_ACCOUNTING]: 'Finance & Accounting',
      [ProjectCategory.MUSIC_AUDIO]: 'Music & Audio',
      [ProjectCategory.VIDEO_ANIMATION]: 'Video & Animation',
      [ProjectCategory.PHOTOGRAPHY]: 'Photography',
      [ProjectCategory.OTHER]: 'Other'
    };
    
    return categoryLabels[category] || category;
  }

  viewProject(project: ProjectDto): void {
    console.log('👁️ Viewing project:', project.id);
    this.router.navigate(['/workspace', project.id]);
  }

  editProject(project: ProjectDto): void {
    console.log('✏️ Edit project:', project.id);
    // TODO: Implement edit project modal or navigation
    alert(`Edit Project: ${project.title}\\n(Implementation pending)`);
  }

  deleteProject(project: ProjectDto): void {
    if (confirm(`Are you sure you want to delete "${project.title}"? This action cannot be undone.`)) {
      console.log('🗑️ Deleting project:', project.id);
      
      this.projectService.deleteProject(project.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            console.log('✅ Project deleted successfully');
            this.loadProjects(); // Refresh the list
            alert('Project deleted successfully!');
          },
          error: (error) => {
            console.error('❌ Error deleting project:', error);
            alert('Error deleting project: ' + (error.error?.message || error.message || 'Unknown error'));
          }
        });
    }
  }

  formatBudget(project: ProjectDto): string {
    if (project.projectType === 'HOURLY') {
      return `$${project.budgetMin}-${project.budgetMax}/hr`;
    } else {
      return `$${project.budgetMin.toLocaleString()}-$${project.budgetMax.toLocaleString()}`;
    }
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString();
  }

  getEndItem(): number {
    return Math.min((this.currentPage + 1) * this.itemsPerPage, this.totalItems);
  }

  isOverdue(deadline: string | undefined, status: ProjectStatus): boolean {
    if (!deadline || status === ProjectStatus.COMPLETED || status === ProjectStatus.CANCELLED) {
      return false;
    }
    return new Date(deadline) < new Date();
  }

  refreshData(): void {
    console.log('🔄 Refreshing project data...');
    this.isLoading = true;
    this.loadProjects().finally(() => {
      this.isLoading = false;
    });
  }
}
