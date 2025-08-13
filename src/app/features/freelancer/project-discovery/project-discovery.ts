import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Subject, takeUntil, debounceTime, distinctUntilChanged, interval } from 'rxjs';
import { Project, ProjectCategory, ProjectFilters } from '../../../shared/models/project';
import { ProjectService, ProjectDto, ProjectCategory as ServiceProjectCategory } from '../../../shared/services/project.service';
import { ApplicationService, ApplicationRequest, ApplicationDto, ApplicationStatus } from '../../../shared/services/application.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { SharedNavbar, NavbarConfig } from '../../../shared/components/shared-navbar/shared-navbar';
import { SharedFooter } from '../../../shared/components/shared-footer/shared-footer';

interface Banner {
  id: number;
  title: string;
  description: string;
  buttonText: string;
  icon: string;
  action: string;
}

interface TalentProfile {
  id: string;
  name: string;
  type: 'freelancer' | 'service_company';
  avatar?: string;
  rating: number;
  reviews: number;
  title: string;
  specialization?: string;
  experienceLevel?: string;
  hourlyRate?: number;
  skills?: string[];
  companyName?: string;
  teamSize?: number;
  portfolio?: PortfolioItem[];
}

interface PortfolioItem {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
  projectUrl?: string;
  technologies: string[];
}

@Component({
  selector: 'app-project-discovery',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    RouterModule,
    TranslateModule,
    SharedNavbar,
    SharedFooter
  ],
  templateUrl: './project-discovery.html',
  styleUrl: './project-discovery.scss'
})
export class ProjectDiscovery implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  searchForm!: FormGroup;
  applicationForm!: FormGroup;
  projects: ProjectDto[] = [];
  paginatedProjects: ProjectDto[] = [];
  savedProjectsCount = 0;
  isLoading = true;
  showFilters = false;
  activeView: 'all' | 'saved' = 'all';
  sortBy = 'newest';
  
  navbarConfig: NavbarConfig = {
    title: 'projectDiscovery.header.title',
    showLanguageToggle: true,
    showProfileLink: true,
    customButtons: [
      {
        label: 'projectDiscovery.header.projectOffers',
        route: '/project-offers',
        class: 'px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors duration-200'
      }
    ]
  };
  
  // Modal states
  showProjectModal = false;
  showApplicationModal = false;
  selectedProject: ProjectDto | null = null;
  
  // Application form state
  isSubmittingApplication = false;
  uploadedFiles: File[] = [];
  selectedAttachments: string[] = [];
  myApplications: ApplicationDto[] = [];
  
  // Mock current user profile
  currentUser: TalentProfile = {
    id: 'current-user-id',
    name: 'Alex Johnson',
    type: 'freelancer',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=60&h=60&fit=crop&crop=face',
    rating: 4.8,
    reviews: 42,
    title: 'Full-Stack Developer',
    specialization: 'Full-Stack Development',
    experienceLevel: 'senior',
    hourlyRate: 65,
    skills: ['React', 'Node.js', 'MongoDB', 'TypeScript', 'AWS'],
    portfolio: [
      {
        id: '1',
        title: 'E-commerce Platform',
        description: 'Built a complete e-commerce solution with React and Node.js',
        imageUrl: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=300&h=200&fit=crop',
        projectUrl: 'https://example.com/project1',
        technologies: ['React', 'Node.js', 'MongoDB', 'Stripe']
      },
      {
        id: '2',
        title: 'Task Management App',
        description: 'Developed a team collaboration tool with real-time features',
        imageUrl: 'https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=300&h=200&fit=crop',
        projectUrl: 'https://example.com/project2',
        technologies: ['Vue.js', 'Firebase', 'Socket.io']
      },
      {
        id: '3',
        title: 'Analytics Dashboard',
        description: 'Created a comprehensive data visualization dashboard',
        imageUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=300&h=200&fit=crop',
        projectUrl: 'https://example.com/project3',
        technologies: ['Angular', 'D3.js', 'Python', 'PostgreSQL']
      }
    ]
  };
  
  // Banner slider
  banners: Banner[] = [
    {
      id: 1,
      title: 'projectDiscovery.banners.featuredProjects.title',
      description: 'projectDiscovery.banners.featuredProjects.description',
      buttonText: 'projectDiscovery.banners.featuredProjects.buttonText',
      icon: '🚀',
      action: 'explore'
    },
    {
      id: 2,
      title: 'projectDiscovery.banners.skillMatch.title',
      description: 'projectDiscovery.banners.skillMatch.description',
      buttonText: 'projectDiscovery.banners.skillMatch.buttonText',
      icon: '📚',
      action: 'courses'
    },
    {
      id: 3,
      title: 'projectDiscovery.banners.urgentProjects.title',
      description: 'projectDiscovery.banners.urgentProjects.description',
      buttonText: 'projectDiscovery.banners.urgentProjects.buttonText',
      icon: '💰',
      action: 'earn'
    }
  ];
  currentBannerIndex = 0;
  
  // Filter options
  availableSkills: string[] = [];
  selectedSkills: string[] = [];
  categories: { value: ProjectCategory; label: string; icon: string }[] = [];
  
  // Pagination
  currentPage = 1;
  itemsPerPage = 10;
  totalPages = 1;
  Math = Math;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private projectService: ProjectService,
    private applicationService: ApplicationService,
    public translate: TranslateService
  ) {
    console.log('ProjectDiscovery component initialized');
  }

  ngOnInit(): void {
    console.log('ProjectDiscovery ngOnInit called');
    this.initializeForms();
    this.loadInitialData();
    this.setupFormSubscriptions();
    this.loadSavedProjectsCount();
    this.loadMyApplications(); // Load user's applications
    this.startBannerAutoSlide();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  initializeForms(): void {
    this.searchForm = this.fb.group({
      keyword: [''],
      category: [''],
      skills: [[]],
      projectType: [''],
      budgetMin: [''],
      budgetMax: [''],
      complexity: [''],
      isRemote: [false]
    });

    this.applicationForm = this.fb.group({
      coverLetter: ['', [Validators.required, Validators.minLength(50), Validators.maxLength(2000)]],
      proposedBudget: ['', [Validators.required, Validators.min(1)]],
      proposedTimeline: ['', [Validators.required]],
      hourlyRate: [this.currentUser.hourlyRate || ''],
      additionalQuestions: ['']
    });
    
    console.log('Forms initialized');
  }

  loadInitialData(): void {
    console.log('Loading initial data...');
    
    // Load project categories
    this.projectService.getProjectCategories().subscribe({
      next: (categories) => {
        this.categories = categories.map(cat => ({
          value: cat.value as any,
          label: cat.label,
          icon: this.getCategoryIcon(cat.value)
        }));
        console.log('Categories loaded:', this.categories);
      },
      error: (error) => {
        console.error('Error loading categories:', error);
      }
    });
    
    // Set available skills (you might want to load these from an API too)
    this.availableSkills = [
      'JavaScript', 'TypeScript', 'Angular', 'React', 'Vue.js', 'Node.js',
      'Python', 'Java', 'C#', 'PHP', 'Ruby', 'Go', 'Swift', 'Kotlin',
      'HTML', 'CSS', 'SCSS', 'Bootstrap', 'Tailwind CSS',
      'MongoDB', 'PostgreSQL', 'MySQL', 'Redis',
      'AWS', 'Azure', 'Docker', 'Kubernetes'
    ];
    
    console.log('Skills loaded:', this.availableSkills.length);
    
    // Load all projects initially
    this.loadAllProjects();
  }

  loadAllProjects(): void {
    console.log('Loading all projects...');
    this.isLoading = true;
    
    this.projectService.getAllOpenProjects()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (projects: ProjectDto[]) => {
          console.log('Projects received:', projects.length);
          this.projects = projects;
          this.sortProjects();
          this.updatePagination();
          this.isLoading = false;
        },
        error: (error: any) => {
          console.error('Error loading projects:', error);
          this.isLoading = false;
        }
      });
  }

  getCategoryIcon(category: string): string {
    const iconMap: { [key: string]: string } = {
      'WEB_DEVELOPMENT': '💻',
      'MOBILE_DEVELOPMENT': '📱',
      'DESKTOP_DEVELOPMENT': '🖥️',
      'DESIGN_CREATIVE': '🎨',
      'DATA_SCIENCE': '📊',
      'MARKETING_SALES': '📈',
      'WRITING_TRANSLATION': '✍️',
      'BUSINESS_CONSULTING': '💼',
      'ENGINEERING_ARCHITECTURE': '🏗️',
      'LEGAL': '⚖️',
      'FINANCE_ACCOUNTING': '💰',
      'MUSIC_AUDIO': '🎵',
      'VIDEO_ANIMATION': '🎬',
      'PHOTOGRAPHY': '📸',
      'OTHER': '📋'
    };
    return iconMap[category] || '📋';
  }

  setupFormSubscriptions(): void {
    this.searchForm.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        if (this.activeView === 'all') {
          console.log('Form changed, searching projects...');
          this.searchProjects();
        }
      });
  }

  loadSavedProjectsCount(): void {
    // TODO: Implement saved projects functionality with ProjectService
    this.savedProjectsCount = 0;
    console.log('Saved projects count:', this.savedProjectsCount);
  }

  // Banner Methods
  startBannerAutoSlide(): void {
    interval(5000)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.nextBanner();
      });
  }

  nextBanner(): void {
    this.currentBannerIndex = (this.currentBannerIndex + 1) % this.banners.length;
  }

  previousBanner(): void {
    this.currentBannerIndex = this.currentBannerIndex === 0 
      ? this.banners.length - 1 
      : this.currentBannerIndex - 1;
  }

  goToBanner(index: number): void {
    this.currentBannerIndex = index;
  }

  onBannerAction(banner: Banner): void {
    console.log('Banner action clicked:', banner.action);
    switch (banner.action) {
      case 'explore':
        alert('Opening Pro-Connect 101 guide...');
        break;
      case 'courses':
        alert('Redirecting to courses...');
        break;
      case 'earn':
        alert('Starting earning journey...');
        break;
    }
  }

  // Modal Methods
  openProjectModal(project: ProjectDto): void {
    this.selectedProject = project;
    this.showProjectModal = true;
    document.body.style.overflow = 'hidden';
    console.log('Project modal opened for:', project.title);
  }

  closeProjectModal(): void {
    this.showProjectModal = false;
    this.selectedProject = null;
    document.body.style.overflow = 'auto';
    console.log('Project modal closed');
  }

openApplicationModal(project: ProjectDto): void {
  console.log('Opening application modal for project:', project.title);
  
  // Close the project modal first but keep the project reference
  if (this.showProjectModal) {
    this.showProjectModal = false;
  }
  
  // Set the selected project for the application modal
  this.selectedProject = project;
  
  // Make sure the form is initialized
  if (!this.applicationForm) {
    console.log('Form not initialized, initializing now...');
    this.initializeForms();
  }
  
  // Pre-fill form with project-related data
  this.applicationForm.patchValue({
    proposedBudget: project.budgetMin || '',
    proposedTimeline: project.timeline || '',
    hourlyRate: this.currentUser.hourlyRate || 65
  });
  
  this.showApplicationModal = true;
  document.body.style.overflow = 'hidden';
  document.body.classList.add('modal-open');
  
  console.log('Application modal opened');
  console.log('Selected project:', this.selectedProject?.title);
  console.log('Form initialized:', !!this.applicationForm);
  console.log('Form valid:', this.applicationForm?.valid);
}

closeApplicationModal(): void {
  console.log('Closing application modal');
  this.showApplicationModal = false;
  // Don't clear selectedProject here, in case we want to reopen
  // this.selectedProject = null;
  
  if (this.applicationForm) {
    this.applicationForm.reset();
  }
  this.uploadedFiles = [];
  this.selectedAttachments = [];
  document.body.style.overflow = 'auto';
  document.body.classList.remove('modal-open');
}

  // Application Methods
  onFileSelect(event: any): void {
    const files = Array.from(event.target.files) as File[];
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/png'];
    
    for (const file of files) {
      if (file.size > maxSize) {
        alert(`File ${file.name} is too large. Maximum size is 10MB.`);
        continue;
      }
      
      if (!allowedTypes.includes(file.type)) {
        alert(`File ${file.name} has unsupported format. Please upload PDF, DOC, DOCX, JPG, or PNG files.`);
        continue;
      }
      
      if (this.uploadedFiles.length < 5) {
        this.uploadedFiles.push(file);
      } else {
        alert('Maximum 5 files allowed.');
        break;
      }
    }
  }

  removeFile(index: number): void {
    this.uploadedFiles.splice(index, 1);
  }

  submitApplication(): void {
    console.log('Submitting application...');
    if (this.applicationForm.valid && this.selectedProject) {
      this.isSubmittingApplication = true;
      
      // Create application request using the new ApplicationRequest interface
      const applicationRequest: ApplicationRequest = {
        coverLetter: this.applicationForm.value.coverLetter,
        proposedBudget: this.applicationForm.value.proposedBudget,
        proposedTimeline: this.applicationForm.value.proposedTimeline,
        hourlyRate: this.applicationForm.value.hourlyRate || undefined,
        additionalQuestions: this.applicationForm.value.additionalQuestions || undefined,
        attachmentPaths: this.selectedAttachments.length > 0 ? this.selectedAttachments.join(',') : undefined
      };

      // Use the new applyToProject method
      this.applicationService.applyToProject(this.selectedProject.id, applicationRequest)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (application: ApplicationDto) => {
            console.log('Application submitted successfully:', application);
            this.isSubmittingApplication = false;
            this.closeApplicationModal();
            
            // Show success message
            alert('Application submitted successfully!');
            
            // Update project application count
            if (this.selectedProject) {
              this.selectedProject.applicationCount += 1;
            }
            
            // Optionally refresh projects to get updated counts
            this.loadAllProjects();
          },
          error: (error: any) => {
            console.error('Error submitting application:', error);
            this.isSubmittingApplication = false;
            
            // Show user-friendly error message
            const errorMessage = error?.error?.message || error?.message || 'Failed to submit application. Please try again.';
            alert(`Error: ${errorMessage}`);
          }
        });
    } else {
      this.markApplicationFormTouched();
    }
  }

  markApplicationFormTouched(): void {
    Object.keys(this.applicationForm.controls).forEach(key => {
      this.applicationForm.get(key)?.markAsTouched();
    });
  }

  isApplicationFieldInvalid(fieldName: string): boolean {
    const field = this.applicationForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getApplicationErrorMessage(fieldName: string): string {
    const control = this.applicationForm.get(fieldName);
    if (control?.hasError('required')) {
      return 'This field is required';
    }
    if (control?.hasError('minlength')) {
      const minLength = control.errors?.['minlength']?.requiredLength;
      return `Minimum ${minLength} characters required`;
    }
    if (control?.hasError('maxlength')) {
      const maxLength = control.errors?.['maxlength']?.requiredLength;
      return `Maximum ${maxLength} characters allowed`;
    }
    if (control?.hasError('min')) {
      return 'Value must be greater than 0';
    }
    return '';
  }

  getFileSize(size: number): string {
    if (size < 1024) return size + ' B';
    if (size < 1024 * 1024) return Math.round(size / 1024) + ' KB';
    return Math.round(size / (1024 * 1024)) + ' MB';
  }

  // Rest of your existing methods...
  searchProjects(): void {
    console.log('searchProjects called');
    this.isLoading = true;
    
    const formValue = this.searchForm.value;
    
    // Create filters object with correct types for ProjectService
    const filters: {
      keyword?: string;
      category?: ServiceProjectCategory;
      minBudget?: number;
      maxBudget?: number;
      isRemote?: boolean;
      isUrgent?: boolean;
      isFeatured?: boolean;
    } = {};
    
    if (formValue.keyword && formValue.keyword.trim()) {
      filters.keyword = formValue.keyword.trim();
    }
    
    if (formValue.category && formValue.category !== '') {
      // Convert the category string to the correct enum value
      filters.category = formValue.category as ServiceProjectCategory;
    }
    
    if (formValue.budgetMin && formValue.budgetMin > 0) {
      filters.minBudget = formValue.budgetMin;
    }
    
    if (formValue.budgetMax && formValue.budgetMax > 0) {
      filters.maxBudget = formValue.budgetMax;
    }
    
    if (formValue.isRemote === true) {
      filters.isRemote = true;
    }
    
    if (formValue.isUrgent === true) {
      filters.isUrgent = true;
    }
    
    if (formValue.isFeatured === true) {
      filters.isFeatured = true;
    }
    
    console.log('Clean filters being applied:', filters);
    
    this.projectService.searchProjects(filters)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (projects: ProjectDto[]) => {
          console.log('Projects received:', projects.length);
          this.projects = projects;
          this.sortProjects();
          this.updatePagination();
          this.isLoading = false;
        },
        error: (error: any) => {
          console.error('Error loading projects:', error);
          this.isLoading = false;
        }
      });
  }

  loadSavedProjects(): void {
    console.log('Loading saved projects...');
    this.isLoading = true;
    
    // TODO: Implement saved projects functionality with ProjectService
    // For now, show empty list
    this.projects = [];
    this.updatePagination();
    this.isLoading = false;
  }

  switchView(view: 'all' | 'saved'): void {
    console.log('Switching to view:', view);
    this.activeView = view;
    if (view === 'saved') {
      this.loadSavedProjects();
    } else {
      this.searchProjects();
    }
  }

  toggleFilters(): void {
    this.showFilters = !this.showFilters;
    console.log('Filters toggled:', this.showFilters);
  }

  toggleCategory(category: ProjectCategory): void {
    const currentCategory = this.searchForm.get('category')?.value;
    const newCategory = currentCategory === category ? '' : category;
    this.searchForm.patchValue({ category: newCategory });
    console.log('Category toggled:', newCategory);
  }

  toggleSkill(skill: string): void {
    const index = this.selectedSkills.indexOf(skill);
    if (index > -1) {
      this.selectedSkills.splice(index, 1);
    } else {
      this.selectedSkills.push(skill);
    }
    this.searchForm.patchValue({ skills: this.selectedSkills });
    console.log('Skills updated:', this.selectedSkills);
  }

  clearFilters(): void {
    console.log('Clearing filters...');
    this.searchForm.reset({
      keyword: '',
      category: '',
      skills: [],
      projectType: '',
      budgetMin: '',
      budgetMax: '',  
      complexity: '',
      isRemote: false
    });
    this.selectedSkills = [];
  }

  sortProjects(): void {
    console.log('Sorting projects by:', this.sortBy);
    switch (this.sortBy) {
      case 'newest':
        this.projects.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case 'budget-high':
        this.projects.sort((a, b) => (b.budgetMax || b.budgetMin || 0) - (a.budgetMax || a.budgetMin || 0));
        break;
      case 'budget-low':
        this.projects.sort((a, b) => (a.budgetMin || a.budgetMax || 0) - (b.budgetMin || b.budgetMax || 0));
        break;
      case 'proposals':
        this.projects.sort((a, b) => a.applicationCount - b.applicationCount);
        break;
    }
    this.updatePagination();
  }

  toggleSaveProject(project: Project, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    console.log('Toggling save for project:', project.id);
    // TODO: Implement save/unsave project functionality with ProjectService
    if (this.isProjectSaved(project.id)) {
      console.log('Would remove saved project:', project.id);
    } else {
      console.log('Would save project:', project.id);
    }
  }

  isProjectSaved(projectId: string): boolean {
    // TODO: Implement saved projects check with ProjectService
    return false;
  }

  viewProjectDetails(project: ProjectDto): void {
    this.openProjectModal(project);
  }

  updatePagination(): void {
    this.totalPages = Math.ceil(this.projects.length / this.itemsPerPage);
    this.currentPage = Math.min(this.currentPage, this.totalPages || 1);
    this.updatePaginatedProjects();
    console.log('Pagination updated - Total pages:', this.totalPages, 'Current page:', this.currentPage);
  }

  updatePaginatedProjects(): void {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.paginatedProjects = this.projects.slice(startIndex, endIndex);
    console.log('Paginated projects updated:', this.paginatedProjects.length);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updatePaginatedProjects();
      console.log('Moved to page:', page);
    }
  }

  getPaginationArray(): number[] {
    const pages = [];
    const start = Math.max(1, this.currentPage - 2);
    const end = Math.min(this.totalPages, this.currentPage + 2);
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  }

  getActiveFiltersCount(): number {
    const formValue = this.searchForm.value;
    let count = 0;
    
    if (formValue.keyword?.trim()) count++;
    if (formValue.category) count++;
    if (this.selectedSkills.length > 0) count++;
    if (formValue.projectType) count++;
    if (formValue.budgetMin) count++;
    if (formValue.budgetMax) count++;
    if (formValue.complexity) count++;
    if (formValue.isRemote) count++;
    
    return count;
  }

  getStarArray(rating: number): number[] {
    return Array(5).fill(0).map((_, i) => i < Math.floor(rating) ? 1 : 0);
  }

  getComplexityColor(complexity: string): string {
    switch (complexity) {
      case 'entry': return 'text-green-600 bg-green-100';
      case 'intermediate': return 'text-yellow-600 bg-yellow-100';
      case 'expert': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  }

  getComplexityLabel(complexity: string): string {
    switch (complexity) {
      case 'entry': return 'Entry Level';
      case 'intermediate': return 'Intermediate';
      case 'expert': return 'Expert';
      default: return complexity;
    }
  }

  formatDate(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'today';
    if (diffDays === 1) return 'yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    
    return new Intl.DateTimeFormat('en-US').format(date);
  }

  // File upload handling
  onFileSelected(event: any): void {
    const files = event.target.files;
    if (files && files.length > 0) {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Check file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
          alert(`File ${file.name} is too large. Maximum size is 10MB.`);
          continue;
        }
        
        // Check file type
        const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/png'];
        if (!allowedTypes.includes(file.type)) {
          alert(`File ${file.name} has an unsupported format. Please use PDF, DOC, DOCX, JPG, or PNG.`);
          continue;
        }
        
        this.uploadedFiles.push(file);
        this.selectedAttachments.push(file.name); // For now, use filename as path
      }
    }
  }

  removeAttachment(index: number): void {
    this.uploadedFiles.splice(index, 1);
    this.selectedAttachments.splice(index, 1);
  }

  // Check if user has already applied to this project
  hasUserAppliedToProject(projectId: number): boolean {
    return this.myApplications.some(app => app.projectId === projectId);
  }

  // Get application status for a project
  getApplicationStatusForProject(projectId: number): ApplicationStatus | null {
    const application = this.myApplications.find(app => app.projectId === projectId);
    return application ? application.status : null;
  }

  // Load user's applications
  loadMyApplications(): void {
    this.applicationService.getMyApplications()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (applications: ApplicationDto[]) => {
          this.myApplications = applications;
          console.log('My applications loaded:', applications.length);
        },
        error: (error: any) => {
          console.error('Error loading my applications:', error);
          // Don't show error to user as this is background loading
        }
      });
  }
}