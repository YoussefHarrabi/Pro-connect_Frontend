import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Subject, takeUntil, debounceTime, distinctUntilChanged, interval } from 'rxjs';
import { Project, ProjectCategory, ProjectFilters } from '../../../shared/models/project';
import { ProjectMarketplaceService } from '../../../shared/services/project-marketplace.service';
import { ApplicationService } from '../../../shared/services/application.service';
import { Application } from '../../../shared/models/application';
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
  projects: Project[] = [];
  paginatedProjects: Project[] = [];
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
  selectedProject: Project | null = null;
  
  // Application form state
  isSubmittingApplication = false;
  uploadedFiles: File[] = [];
  selectedPortfolioItems: string[] = [];
  
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
    private projectService: ProjectMarketplaceService,
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
    this.availableSkills = this.projectService.getAvailableSkills();
    this.categories = this.projectService.getProjectCategories();
    console.log('Categories loaded:', this.categories);
    console.log('Skills loaded:', this.availableSkills.length);
    
    // Load all projects initially
    this.searchProjects();
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
    this.projectService.savedProjects$
      .pipe(takeUntil(this.destroy$))
      .subscribe(savedIds => {
        this.savedProjectsCount = savedIds.length;
        console.log('Saved projects count:', this.savedProjectsCount);
      });
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
  openProjectModal(project: Project): void {
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

openApplicationModal(project: Project): void {
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
    proposedBudget: project.budget.min || '',
    proposedTimeline: project.timeline.duration || '',
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
  this.selectedPortfolioItems = [];
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

  togglePortfolioItem(itemId: string): void {
    const index = this.selectedPortfolioItems.indexOf(itemId);
    if (index > -1) {
      this.selectedPortfolioItems.splice(index, 1);
    } else {
      if (this.selectedPortfolioItems.length < 3) {
        this.selectedPortfolioItems.push(itemId);
      } else {
        alert('Maximum 3 portfolio items can be selected.');
      }
    }
  }

  submitApplication(): void {
    console.log('Submitting application...');
    if (this.applicationForm.valid && this.selectedProject) {
      this.isSubmittingApplication = true;
      
      const portfolioItems = this.currentUser.portfolio?.filter(item => 
        this.selectedPortfolioItems.includes(item.id)
      ) || [];
      
      const applicationData: Partial<Application> = {
        projectId: this.selectedProject.id,
        talentId: this.currentUser.id,
        talentType: this.currentUser.type,
        talentName: this.currentUser.name,
        talentAvatar: this.currentUser.avatar,
        talentRating: this.currentUser.rating,
        talentReviews: this.currentUser.reviews,
        coverLetter: this.applicationForm.value.coverLetter,
        proposedBudget: this.applicationForm.value.proposedBudget,
        proposedTimeline: this.applicationForm.value.proposedTimeline,
        portfolioItems,
        specialization: this.currentUser.specialization,
        experienceLevel: this.currentUser.experienceLevel,
        hourlyRate: this.applicationForm.value.hourlyRate || this.currentUser.hourlyRate,
        skills: this.currentUser.skills,
        companyName: this.currentUser.companyName,
        teamSize: this.currentUser.teamSize
      };

      this.applicationService.submitApplication(applicationData)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (application) => {
            this.isSubmittingApplication = false;
            this.closeApplicationModal();
            alert('Application submitted successfully!');
            
            // Update project proposals count
            if (this.selectedProject) {
              this.selectedProject.proposals += 1;
            }
          },
          error: (error) => {
            console.error('Error submitting application:', error);
            this.isSubmittingApplication = false;
            alert('Error submitting application. Please try again.');
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
    
    // Clean the filters - only include non-empty values
    const filters: ProjectFilters = {};
    
    if (formValue.keyword && formValue.keyword.trim()) {
      filters.keyword = formValue.keyword.trim();
    }
    
    if (formValue.category && formValue.category !== '') {
      filters.category = formValue.category;
    }
    
    if (this.selectedSkills && this.selectedSkills.length > 0) {
      filters.skills = [...this.selectedSkills];
    }
    
    if (formValue.projectType && formValue.projectType !== '') {
      filters.projectType = formValue.projectType;
    }
    
    if (formValue.budgetMin && formValue.budgetMin > 0) {
      filters.budgetMin = formValue.budgetMin;
    }
    
    if (formValue.budgetMax && formValue.budgetMax > 0) {
      filters.budgetMax = formValue.budgetMax;
    }
    
    if (formValue.complexity && formValue.complexity !== '') {
      filters.complexity = formValue.complexity;
    }
    
    if (formValue.isRemote === true) {
      filters.isRemote = true;
    }
    
    console.log('Clean filters being applied:', filters);
    
    this.projectService.searchProjects(filters)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (projects) => {
          console.log('Projects received:', projects.length);
          this.projects = projects;
          this.sortProjects();
          this.updatePagination();
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading projects:', error);
          this.isLoading = false;
        }
      });
  }

  loadSavedProjects(): void {
    console.log('Loading saved projects...');
    this.isLoading = true;
    this.projectService.getSavedProjects()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (projects) => {
          console.log('Saved projects received:', projects.length);
          this.projects = projects;
          this.updatePagination();
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading saved projects:', error);
          this.isLoading = false;
        }
      });
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
        this.projects.sort((a, b) => new Date(b.postedDate).getTime() - new Date(a.postedDate).getTime());
        break;
      case 'budget-high':
        this.projects.sort((a, b) => (b.budget.max || b.budget.min || 0) - (a.budget.max || a.budget.min || 0));
        break;
      case 'budget-low':
        this.projects.sort((a, b) => (a.budget.min || a.budget.max || 0) - (b.budget.min || b.budget.max || 0));
        break;
      case 'proposals':
        this.projects.sort((a, b) => a.proposals - b.proposals);
        break;
    }
    this.updatePagination();
  }

  toggleSaveProject(project: Project, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    console.log('Toggling save for project:', project.id);
    if (this.isProjectSaved(project.id)) {
      this.projectService.removeSavedProject(project.id);
    } else {
      this.projectService.saveProject(project.id);
    }
  }

  isProjectSaved(projectId: string): boolean {
    return this.projectService.isProjectSaved(projectId);
  }

  viewProjectDetails(project: Project): void {
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
}