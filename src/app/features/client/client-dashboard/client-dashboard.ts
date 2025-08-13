import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { SharedNavbar, NavbarConfig } from '../../../shared/components/shared-navbar/shared-navbar';
import { SharedFooter } from '../../../shared/components/shared-footer/shared-footer';

// ✅ Import ProjectService and related types
import { 
  ProjectService, 
  ProjectDto, 
  ProjectStats,
  ProjectCategory,
  ProjectStatus,
  ProjectType,
  ComplexityLevel,
  ProjectCreateRequest,
  ExperienceLevel
} from '../../../shared/services/project.service';

// ✅ Import ApplicationService and related types
import { 
  ApplicationService, 
  ApplicationDto, 
  ApplicationStatus 
} from '../../../shared/services/application.service';
import { BudgetType, OfferCreateRequest, OfferDto, OfferService, OfferStatus } from '../../../shared/services/offer.service';

// Define OngoingProject interface
interface OngoingProject {
  id: string;
  title: string;
  description: string;
  freelancerName: string;
  freelancerId: string;
  budget: number;
  startDate: Date;
  deadline: Date;
  status: 'active' | 'paused' | 'completed';
  progress: number; // 0-100
}

@Component({
  selector: 'app-client-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    FormsModule,
    TranslateModule,
    SharedNavbar,
    SharedFooter
  ],
  templateUrl: './client-dashboard.html',
  styleUrl: './client-dashboard.scss'
})
export class ClientDashboard implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  activeTab: 'projects' | 'applications' | 'offers' | 'ongoing' = 'projects';
  
  navbarConfig: NavbarConfig = {
    title: 'Client Dashboard',
    showLanguageToggle: true,
    showProfileLink: true,
    customButtons: [
      {
        label: 'Post New Project',
        route: '/project-posting',
        class: 'px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors duration-200'
      }
    ]
  };

  // ✅ Main data properties
  projects: ProjectDto[] = [];
  projectStats: ProjectStats | null = null;
  applications: ApplicationDto[] = [];
  offers: OfferDto[] = [];
  BudgetType = BudgetType;
  OfferStatus = OfferStatus;
  ongoingProjects: OngoingProject[] = [];
  isLoading = false;
  
  // Modal states
  showApplicationModal = false;
  showOfferModal = false;
  showEditProjectModal = false;
  selectedApplication: ApplicationDto | null = null;
  selectedProject: ProjectDto | null = null;
  
  // Forms
  offerForm!: FormGroup;
  editProjectForm!: FormGroup;
  
  // Filters
  selectedProjectFilter = '';
  selectedStatusFilter = '';
  selectedProjectStatusFilter = '';

  // ✅ Expose enums for template
  ProjectStatus = ProjectStatus;
  ProjectCategory = ProjectCategory;
  ApplicationStatus = ApplicationStatus;

  // Menu state
  showProjectMenu: number | null = null;

  Math = Math;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private projectService: ProjectService,
    private applicationService: ApplicationService,
    private translate: TranslateService,
    private offerService: OfferService, // ✅ Add this

  ){
  const currentUser = this.applicationService.getCurrentUsername();
  console.log('🚀 ClientDashboard initialized for user:', currentUser || 'Not authenticated');
}


  ngOnInit(): void {
    this.initializeForms();
    this.loadData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  initializeForms(): void {
    // Offer form
   this.offerForm = this.fb.group({
    title: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(100)]],
    description: ['', [Validators.required, Validators.minLength(20), Validators.maxLength(1000)]],
    budgetAmount: ['', [Validators.required, Validators.min(1)]],
    budgetType: [BudgetType.FIXED, Validators.required],
    timeline: ['', [Validators.required, Validators.minLength(3)]],
    startDate: [''],
    terms: ['', [Validators.required, Validators.minLength(50), Validators.maxLength(2000)]]
  });

    // ✅ Edit project form
    this.editProjectForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(150)]],
      description: ['', [Validators.required, Validators.minLength(50), Validators.maxLength(2000)]],
      category: ['', Validators.required],
      skills: ['', Validators.required],
      projectType: ['', Validators.required],
      budgetMin: ['', [Validators.required, Validators.min(1)]],
      budgetMax: ['', [Validators.required, Validators.min(1)]],
      currency: ['EUR', Validators.required],
      budgetNegotiable: [false],
      timeline: ['', Validators.required],
      complexity: ['', Validators.required],
      preferredTalentType: ['', Validators.required],
      experienceLevel: ['', Validators.required],
      location: [''],
      isRemote: [true],
      isUrgent: [false],
      isFeatured: [false],
      deadline: ['']
    });
  }

  // ✅ Load data using available endpoints only
loadData(): void {
  this.isLoading = true;
  const currentUser = this.applicationService.getCurrentUsername();
  console.log('📊 Loading client dashboard data for user:', currentUser);
  
  // ✅ Load ALL projects first, then filter for client's projects
  this.loadAllProjects();
  
  // ✅ Load applications for client's projects
  this.loadApplications();
  this.loadOffers(); // ✅ Add this
}
// Add the loadOffers method:
private loadOffers(): void {
  console.log('📤 Loading offers sent by client...');
  
  this.offerService.getSentOffers()
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (offers) => {
        this.offers = offers;
        console.log('✅ Client offers loaded:', offers.length);
      },
      error: (error) => {
        console.error('❌ Error loading offers:', error);
        this.offers = []; // Fallback to empty array
      }
    });
}

  // ✅ Load all projects and filter for client's projects
// ✅ Update loadAllProjects to use getMyProjects for better accuracy
private loadAllProjects(): void {
  console.log('📋 Loading client projects...');
  
  // Try to use getMyProjects first (more accurate for client dashboard)
  this.projectService.getMyProjects()
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (clientProjects) => {
        this.projects = clientProjects;
        
        console.log('✅ Client projects loaded directly:', this.projects.length);
        console.log('📋 Client projects:', this.projects);
        
        // Calculate stats from projects
        this.calculateProjectStats();
        
        // ✅ Generate ongoing projects from IN_PROGRESS projects
        this.generateOngoingProjects();
        
        this.isLoading = false;
      },
      error: (error) => {
        console.error('❌ Error loading my projects, trying fallback method:', error);
        // Fallback to getAllOpenProjects with filtering
        this.loadAllProjectsWithFilter();
      }
    });
}

// ✅ Fallback method to load all projects and filter
private loadAllProjectsWithFilter(): void {
  console.log('📋 Fallback: Loading all projects and filtering for client...');
  
  this.projectService.getAllOpenProjects()
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (allProjects) => {
        const currentUser = this.applicationService.getCurrentUsername();
        
        // ✅ Filter projects created by the current client (dynamic)
        this.projects = allProjects.filter(project => 
          project.clientUsername === currentUser
        );
        
        console.log('✅ All projects loaded:', allProjects.length);
        console.log('✅ Client projects filtered:', this.projects.length);
        console.log('📋 Client projects:', this.projects);
        
        // Calculate stats from filtered projects
        this.calculateProjectStats();
        
        // ✅ Generate ongoing projects from IN_PROGRESS projects
        this.generateOngoingProjects();
        
        this.isLoading = false;
      },
      error: (error) => {
        console.error('❌ Error loading projects:', error);
        this.isLoading = false;
        // Fallback to mock data
        this.loadMockProjects();
        this.calculateProjectStats();
        this.generateOngoingProjects();
      }
    });
}

  // ✅ Calculate project statistics from loaded projects
  private calculateProjectStats(): void {
    this.projectStats = {
      totalProjects: this.projects.length,
      openProjects: this.projects.filter(p => p.status === ProjectStatus.OPEN).length,
      inProgressProjects: this.projects.filter(p => p.status === ProjectStatus.IN_PROGRESS).length,
      completedProjects: this.projects.filter(p => p.status === ProjectStatus.COMPLETED).length,
      totalApplications: this.applications.length
    };
    
    console.log('📊 Calculated project stats:', this.projectStats);
  }

  // ✅ Load applications for client projects
// ✅ NEW: Load applications using the new endpoint
private loadApplications(): void {
  console.log('📄 Loading applications for client projects...');
  
  this.applicationService.getApplicationsForMyProjects()
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (applications) => {
        this.applications = applications;
        console.log('✅ Client applications loaded:', applications.length);
        
        // Recalculate stats with real data
        this.calculateProjectStats();
      },
      error: (error) => {
        console.error('❌ Error loading client applications:', error);
        // Fallback to mock data
        this.loadMockApplications();
      }
    });
}

  // ✅ Mock data for testing (will be replaced when backend supports client-specific endpoints)
  private loadMockProjects(): void {
    this.projects = [
      {
        id: 1,
        title: 'E-commerce Website Development',
        description: 'Build a modern e-commerce platform with React and Node.js, including user authentication, product catalog, shopping cart, and payment integration.',
        category: ProjectCategory.WEB_DEVELOPMENT,
        skills: ['React', 'Node.js', 'MongoDB', 'Express', 'Payment Integration'],
        projectType: ProjectType.FIXED,
        budgetMin: 4000,
        budgetMax: 6000,
        currency: 'EUR',
        budgetNegotiable: true,
        timeline: '2-3 months',
        complexity: ComplexityLevel.INTERMEDIATE,
        preferredTalentType: 'BOTH' as any,
        experienceLevel: ExperienceLevel.INTERMEDIATE,
        location: 'Remote',
        isRemote: true,
        isUrgent: false,
        isFeatured: true,
        deadline: '2025-09-01',
        status: ProjectStatus.OPEN,
        clientUsername: 'currentUser',
        assignedTalentUsername: undefined,
        applicationCount: 8,
        createdAt: '2025-01-25T10:30:00Z',
        updatedAt: '2025-01-25T10:30:00Z'
      },
      {
        id: 2,
        title: 'Mobile App UI/UX Design',
        description: 'Design a modern and intuitive mobile app interface for a fitness tracking application.',
        category: ProjectCategory.DESIGN_CREATIVE,
        skills: ['UI/UX Design', 'Figma', 'Mobile Design', 'Prototyping'],
        projectType: ProjectType.FIXED,
        budgetMin: 2000,
        budgetMax: 3500,
        currency: 'EUR',
        budgetNegotiable: false,
        timeline: '1 month',
        complexity: ComplexityLevel.INTERMEDIATE,
        preferredTalentType: 'FREELANCER' as any,
        experienceLevel: ExperienceLevel.EXPERT,
        location: 'Remote',
        isRemote: true,
        isUrgent: true,
        isFeatured: false,
        deadline: '2025-08-15',
        status: ProjectStatus.IN_PROGRESS,
        clientUsername: 'currentUser',
        assignedTalentUsername: 'designpro',
        applicationCount: 5,
        createdAt: '2025-01-20T14:15:00Z',
        updatedAt: '2025-01-28T09:20:00Z'
      },
      {
        id: 3,
        title: 'Content Writing for Blog',
        description: 'Write high-quality blog posts about technology and business topics.',
        category: ProjectCategory.WRITING_TRANSLATION,
        skills: ['Content Writing', 'SEO', 'Research', 'Blog Writing'],
        projectType: ProjectType.HOURLY,
        budgetMin: 25,
        budgetMax: 45,
        currency: 'EUR',
        budgetNegotiable: true,
        timeline: '2-4 weeks',
        complexity: ComplexityLevel.ENTRY,
        preferredTalentType: 'FREELANCER' as any,
        experienceLevel: ExperienceLevel.INTERMEDIATE,
        location: 'Remote',
        isRemote: true,
        isUrgent: false,
        isFeatured: false,
        deadline: undefined,
        status: ProjectStatus.COMPLETED,
        clientUsername: 'currentUser',
        assignedTalentUsername: 'writer123',
        applicationCount: 12,
        createdAt: '2025-01-10T08:45:00Z',
        updatedAt: '2025-01-30T16:30:00Z'
      },
      {
        id: 4,
        title: 'Marketing Campaign Development',
        description: 'Create a comprehensive digital marketing campaign including social media strategy, content creation, and analytics tracking.',
        category: ProjectCategory.MARKETING_SALES,
        skills: ['Digital Marketing', 'Social Media', 'Content Strategy', 'Analytics'],
        projectType: ProjectType.FIXED,
        budgetMin: 3000,
        budgetMax: 5000,
        currency: 'EUR',
        budgetNegotiable: true,
        timeline: '6 weeks',
        complexity: ComplexityLevel.INTERMEDIATE,
        preferredTalentType: 'FREELANCER' as any,
        experienceLevel: ExperienceLevel.EXPERT,
        location: 'Remote',
        isRemote: true,
        isUrgent: false,
        isFeatured: true,
        deadline: '2025-09-15',
        status: ProjectStatus.IN_PROGRESS,
        clientUsername: 'currentUser',
        assignedTalentUsername: 'marketingpro',
        applicationCount: 15,
        createdAt: '2025-01-15T11:00:00Z',
        updatedAt: '2025-02-01T14:30:00Z'
      }
    ];
    console.log('✅ Loaded mock projects for testing');
  }

  private loadMockApplications(): void {
    this.applications = [
      {
        id: 1,
        projectId: 1,
        projectTitle: 'E-commerce Website Development',
        applicantUsername: 'johndoe',
        coverLetter: 'Dear Client,\n\nI am excited to apply for your e-commerce website development project. With over 5 years of experience in React and Node.js development, I have successfully delivered numerous e-commerce platforms.\n\nMy approach includes:\n- Detailed project analysis and planning\n- Modern responsive design\n- Secure payment integration\n- Comprehensive testing\n\nI am confident I can deliver a high-quality solution within your timeline and budget.\n\nBest regards,\nJohn Doe',
        proposedBudget: 5200,
        proposedTimeline: '10 weeks',
        hourlyRate: 65,
        additionalQuestions: 'I would like to know more about the specific payment gateways you prefer and any existing design guidelines.',
        attachmentPaths: 'portfolio_showcase.pdf,ecommerce_examples.pdf',
        selectedPortfolioItems: 'project1,project3',
        status: ApplicationStatus.PENDING,
        createdAt: '2025-01-28T10:30:00Z'
      },
      {
        id: 2,
        projectId: 1,
        projectTitle: 'E-commerce Website Development',
        applicantUsername: 'webdevpro',
        coverLetter: 'Hello,\n\nI noticed your e-commerce project and I believe I am the perfect fit. I specialize in full-stack development with React and Node.js.\n\nKey highlights:\n- 7+ years of experience\n- Built 20+ e-commerce platforms\n- Expert in payment integrations (Stripe, PayPal)\n- Available to start immediately\n\nI can deliver a robust, scalable solution that will exceed your expectations.',
        proposedBudget: 4800,
        proposedTimeline: '8 weeks',
        hourlyRate: 70,
        additionalQuestions: 'Do you have any preference for the database (MongoDB vs PostgreSQL)?',
        attachmentPaths: 'technical_portfolio.pdf',
        selectedPortfolioItems: 'project2,project4,project5',
        status: ApplicationStatus.UNDER_REVIEW,
        createdAt: '2025-01-27T14:15:00Z'
      },
      {
        id: 3,
        projectId: 1,
        projectTitle: 'E-commerce Website Development',
        applicantUsername: 'reactmaster',
        coverLetter: 'Hi there,\n\nI am a React specialist with extensive experience in e-commerce development. I have worked with major clients and delivered exceptional results.\n\nWhat I offer:\n- Clean, maintainable code\n- Fast loading times\n- Mobile-first approach\n- SEO optimization\n- 24/7 support during development\n\nLet\'s discuss your project in detail!',
        proposedBudget: 5500,
        proposedTimeline: '12 weeks',
        hourlyRate: 60,
        additionalQuestions: 'Would you need any specific analytics integration (Google Analytics, Facebook Pixel, etc.)?',
        attachmentPaths: 'react_projects.pdf,testimonials.pdf',
        selectedPortfolioItems: 'project6,project7',
        status: ApplicationStatus.SHORTLISTED,
        createdAt: '2025-01-26T09:20:00Z'
      },
      {
        id: 4,
        projectId: 2,
        projectTitle: 'Mobile App UI/UX Design',
        applicantUsername: 'designpro',
        coverLetter: 'Dear Hiring Manager,\n\nI am a UX/UI designer with 4 years of experience in mobile app design. I specialize in creating intuitive and engaging user experiences.\n\nMy design process:\n- User research and analysis\n- Wireframing and prototyping\n- Visual design and branding\n- Usability testing\n\nI would love to help bring your fitness app vision to life!',
        proposedBudget: 2800,
        proposedTimeline: '4 weeks',
        hourlyRate: undefined,
        additionalQuestions: 'Do you have any existing brand guidelines or color preferences for the app?',
        attachmentPaths: 'design_portfolio.pdf',
        selectedPortfolioItems: 'design1,design2',
        status: ApplicationStatus.ACCEPTED,
        createdAt: '2025-01-29T11:45:00Z'
      },
      {
        id: 5,
        projectId: 4,
        projectTitle: 'Marketing Campaign Development',
        applicantUsername: 'marketingpro',
        coverLetter: 'Hello,\n\nI am a digital marketing specialist with 6+ years of experience in creating successful marketing campaigns. I have helped numerous businesses increase their online presence and conversions.\n\nMy expertise includes:\n- Social media strategy\n- Content marketing\n- Performance analytics\n- Campaign optimization\n\nI am excited to help grow your business!',
        proposedBudget: 4200,
        proposedTimeline: '6 weeks',
        hourlyRate: undefined,
        additionalQuestions: 'What are your current marketing channels and main target audience?',
        attachmentPaths: 'marketing_portfolio.pdf',
        selectedPortfolioItems: 'campaign1,campaign2,campaign3',
        status: ApplicationStatus.ACCEPTED,
        createdAt: '2025-01-16T13:20:00Z'
      },
      {
        id: 6,
        projectId: 3,
        projectTitle: 'Content Writing for Blog',
        applicantUsername: 'contentwriter',
        coverLetter: 'Hello,\n\nI am a professional content writer with expertise in technology and business topics. I have written for various tech blogs and publications.\n\nMy writing includes:\n- SEO-optimized content\n- Engaging and informative articles\n- Well-researched topics\n- Timely delivery\n\nI look forward to contributing to your blog!',
        proposedBudget: 0,
        proposedTimeline: '3 weeks',
        hourlyRate: 35,
        additionalQuestions: 'What is the preferred word count per article and posting frequency?',
        attachmentPaths: 'writing_samples.pdf',
        selectedPortfolioItems: 'article1,article2,article3',
        status: ApplicationStatus.REJECTED,
        createdAt: '2025-01-15T16:30:00Z'
      }
    ];
    console.log('✅ Loaded mock applications for testing');
  }

  // ✅ Generate ongoing projects from IN_PROGRESS projects
  private generateOngoingProjects(): void {
    console.log('🔄 Generating ongoing projects from IN_PROGRESS projects...');
    
    // Find projects with IN_PROGRESS status
    const inProgressProjects = this.projects.filter(project => 
      project.status === ProjectStatus.IN_PROGRESS
    );
    
    console.log('📋 Found IN_PROGRESS projects:', inProgressProjects.length);
    
    // Convert to OngoingProject format
    this.ongoingProjects = inProgressProjects.map(project => {
      // Find accepted application for this project to get freelancer info
      const acceptedApp = this.applications.find(app => 
        app.projectId === project.id && app.status === ApplicationStatus.ACCEPTED
      );
      
      return {
        id: `ongoing-${project.id}`,
        title: project.title,
        description: project.description,
        freelancerName: acceptedApp ? acceptedApp.applicantUsername : project.assignedTalentUsername || 'Assigned Freelancer',
        freelancerId: acceptedApp ? acceptedApp.applicantUsername : project.assignedTalentUsername || 'unknown',
        budget: project.budgetMax || project.budgetMin || 0,
        startDate: project.updatedAt ? new Date(project.updatedAt) : new Date(project.createdAt),
        deadline: project.deadline ? new Date(project.deadline) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Default 30 days from now
        status: 'active' as const,
        progress: Math.floor(Math.random() * 60) + 20 // Random progress between 20-80% for demo
      };
    });
    
    console.log('✅ Generated ongoing projects:', this.ongoingProjects.length);
  }

  // ✅ Tab switching
  switchTab(tab: 'projects' | 'applications' | 'offers' | 'ongoing'): void {
    this.activeTab = tab;
    console.log('📑 Switched to tab:', tab);
  }

  // ✅ Project management methods
  editProject(project: ProjectDto): void {
    this.selectedProject = project;
    
    // Pre-fill edit form
    this.editProjectForm.patchValue({
      title: project.title,
      description: project.description,
      category: project.category,
      skills: project.skills ? project.skills.join(', ') : '',
      projectType: project.projectType,
      budgetMin: project.budgetMin,
      budgetMax: project.budgetMax,
      currency: project.currency || 'EUR',
      budgetNegotiable: project.budgetNegotiable,
      timeline: project.timeline,
      complexity: project.complexity,
      preferredTalentType: project.preferredTalentType,
      experienceLevel: project.experienceLevel,
      location: project.location,
      isRemote: project.isRemote,
      isUrgent: project.isUrgent,
      isFeatured: project.isFeatured,
      deadline: project.deadline
    });
    
    this.showEditProjectModal = true;
    document.body.style.overflow = 'hidden';
  }

  closeEditProjectModal(): void {
    this.showEditProjectModal = false;
    this.selectedProject = null;
    this.editProjectForm.reset();
    document.body.style.overflow = 'auto';
  }

  saveProjectChanges(): void {
    if (this.editProjectForm.valid && this.selectedProject) {
      this.isLoading = true;
      
      const formValue = this.editProjectForm.value;
      
      // Convert skills string to array
      const skillsArray = formValue.skills 
        ? formValue.skills.split(',').map((skill: string) => skill.trim()).filter((skill: string) => skill.length > 0)
        : [];
      
      const updateRequest: ProjectCreateRequest = {
        title: formValue.title,
        description: formValue.description,
        category: formValue.category,
        skills: skillsArray,
        projectType: formValue.projectType,
        budgetMin: parseFloat(formValue.budgetMin),
        budgetMax: parseFloat(formValue.budgetMax),
        currency: formValue.currency,
        budgetNegotiable: formValue.budgetNegotiable,
        timeline: formValue.timeline,
        complexity: formValue.complexity,
        preferredTalentType: formValue.preferredTalentType,
        experienceLevel: formValue.experienceLevel,
        location: formValue.location,
        isRemote: formValue.isRemote,
        isUrgent: formValue.isUrgent,
        isFeatured: formValue.isFeatured,
        deadline: formValue.deadline
      };

      this.projectService.updateProject(this.selectedProject.id, updateRequest)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (updatedProject) => {
            // Update project in the list
            const index = this.projects.findIndex(p => p.id === updatedProject.id);
            if (index !== -1) {
              this.projects[index] = updatedProject;
            }
            
            this.closeEditProjectModal();
            this.isLoading = false;
            alert('Project updated successfully!');
          },
          error: (error) => {
            console.error('❌ Error updating project:', error);
            this.isLoading = false;
            alert('Error updating project. Please try again.');
          }
        });
    }
  }

  deleteProject(project: ProjectDto): void {
    if (confirm(`Are you sure you want to delete "${project.title}"? This action cannot be undone.`)) {
      this.projectService.deleteProject(project.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.projects = this.projects.filter(p => p.id !== project.id);
            this.calculateProjectStats(); // Recalculate stats
            alert('Project deleted successfully!');
          },
          error: (error) => {
            console.error('❌ Error deleting project:', error);
            alert('Error deleting project. Please try again.');
          }
        });
    }
  }

  closeProject(project: ProjectDto): void {
    if (confirm(`Are you sure you want to close "${project.title}"? No more applications will be accepted.`)) {
      // TODO: Implement when backend supports closeProject endpoint
      console.log('🔒 Closing project:', project.title);
      
      // Mock implementation for now
      const index = this.projects.findIndex(p => p.id === project.id);
      if (index !== -1) {
        this.projects[index] = { ...project, status: ProjectStatus.CLOSED };
        this.calculateProjectStats();
        alert('Project closed successfully!');
      }
    }
  }

  reopenProject(project: ProjectDto): void {
    // TODO: Implement when backend supports reopenProject endpoint
    console.log('🔓 Reopening project:', project.title);
    
    // Mock implementation for now
    const index = this.projects.findIndex(p => p.id === project.id);
    if (index !== -1) {
      this.projects[index] = { ...project, status: ProjectStatus.OPEN };
      this.calculateProjectStats();
      alert('Project reopened successfully!');
    }
  }

  viewProjectApplications(project: ProjectDto): void {
    // Navigate to applications with filter
    this.activeTab = 'applications';
    this.selectedProjectFilter = project.id.toString();
    console.log('👀 Viewing applications for project:', project.title);
  }

  duplicateProject(project: ProjectDto): void {
    // Navigate to project posting with pre-filled data
    this.router.navigate(['/project-posting'], {
      queryParams: {
        duplicate: project.id
      }
    });
  }

  // ✅ Application management methods
// ✅ Update updateApplicationStatus to use real API
updateApplicationStatus(application: ApplicationDto, status: ApplicationStatus): void {
  console.log(`📝 Updating application ${application.id} status to: ${status}`);
  
  this.applicationService.updateApplicationStatus(application.id, status)
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (updatedApplication) => {
        // Update local state with the response
        const index = this.applications.findIndex(app => app.id === application.id);
        if (index !== -1) {
          this.applications[index] = updatedApplication;
        }
        
        // Show success message
        const statusLabel = this.applicationService.getStatusLabel(status);
        alert(`Application marked as ${statusLabel.toLowerCase()}`);
      },
      error: (error) => {
        console.error('❌ Error updating application status:', error);
        alert('Error updating application status. Please try again.');
      }
    });
}

  openApplicationModal(application: ApplicationDto): void {
    this.selectedApplication = application;
    this.showApplicationModal = true;
    document.body.style.overflow = 'hidden';
    console.log('👀 Viewing application details:', application);
  }

  closeApplicationModal(): void {
    this.showApplicationModal = false;
    this.selectedApplication = null;
    document.body.style.overflow = 'auto';
  }

  acceptApplication(application: ApplicationDto): void {
    if (confirm(`Are you sure you want to accept the application from ${application.applicantUsername}? This will start the project.`)) {
      this.updateApplicationStatus(application, ApplicationStatus.ACCEPTED);
      this.closeApplicationModal();
      console.log('✅ Application accepted!');
    }
  }

  // ✅ Offer management methods
openOfferModal(application: ApplicationDto): void {
  this.selectedApplication = application;
  
  // Pre-fill offer form with application data
  this.offerForm.patchValue({
    title: `Offer for ${application.projectTitle}`,
    description: `We would like to offer you the project: ${application.projectTitle}`,
    budgetAmount: application.proposedBudget,
    budgetType: application.hourlyRate ? BudgetType.HOURLY : BudgetType.FIXED,
    timeline: application.proposedTimeline,
    terms: 'Payment will be made in milestones as agreed. All work must be completed to satisfaction before final payment.'
  });
  
  this.showOfferModal = true;
  document.body.style.overflow = 'hidden';
}

  closeOfferModal(): void {
    this.showOfferModal = false;
    this.selectedApplication = null;
    this.offerForm.reset();
    document.body.style.overflow = 'auto';
  }

// Update the sendOffer method to use the real API:
sendOffer(): void {
  if (this.offerForm.valid && this.selectedApplication) {
    const formValue = this.offerForm.value;
    
    // Validate the offer request
    const offerRequest: OfferCreateRequest = {
      title: formValue.title,
      description: formValue.description,
      budgetAmount: parseFloat(formValue.budgetAmount),
      budgetType: formValue.budgetType,
      timeline: formValue.timeline,
      startDate: formValue.startDate || undefined,
      terms: formValue.terms
    };

    // Validate the request
    const validationErrors = this.offerService.validateOfferRequest(offerRequest);
    if (validationErrors.length > 0) {
      alert('Please fix the following errors:\n' + validationErrors.join('\n'));
      return;
    }

    console.log('📤 Sending offer:', offerRequest);
    
    this.offerService.createOffer(this.selectedApplication.id, offerRequest)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          console.log('✅ Offer sent successfully:', response);
          
          // Update application status locally
          const appIndex = this.applications.findIndex(app => app.id === this.selectedApplication!.id);
          if (appIndex !== -1) {
            this.applications[appIndex].status = ApplicationStatus.OFFER_SENT;
          }
          
          // Refresh offers list
          this.loadOffers();
          
          this.closeOfferModal();
          alert('Offer sent successfully!');
        },
        error: (error) => {
          console.error('❌ Error sending offer:', error);
          alert('Error sending offer: ' + error);
        }
      });
  } else {
    console.log('❌ Form is invalid or no application selected');
    this.markFormGroupTouched(this.offerForm);
  }
}


  // ✅ Helper methods
  getProjectStatusColor(status: ProjectStatus): string {
    switch (status) {
      case ProjectStatus.OPEN: return 'text-green-600 bg-green-100';
      case ProjectStatus.IN_PROGRESS: return 'text-blue-600 bg-blue-100';
      case ProjectStatus.COMPLETED: return 'text-purple-600 bg-purple-100';
      case ProjectStatus.CLOSED: return 'text-gray-600 bg-gray-100';
      case ProjectStatus.CANCELLED: return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  }
  

  getProjectStatusLabel(status: ProjectStatus): string {
    return this.projectService.getProjectStatusLabel(status);
  }

  getCategoryLabel(category: ProjectCategory): string {
    return this.projectService.getCategoryLabel(category);
  }

  formatBudgetRange(project: ProjectDto): string {
    return this.projectService.formatBudgetRange(project);
  }

  getStatusColor(status: ApplicationStatus): string {
    return this.applicationService.getStatusColor(status);
  }

  canEditProject(project: ProjectDto): boolean {
    return project.status === ProjectStatus.OPEN;
  }

  canCloseProject(project: ProjectDto): boolean {
    return project.status === ProjectStatus.OPEN;
  }

  canReopenProject(project: ProjectDto): boolean {
    return project.status === ProjectStatus.CLOSED;
  }

  formatDate(dateString: string): string {
    return this.applicationService.formatDate(dateString);
  }

  getStarArray(rating: number): number[] {
    return Array(5).fill(0).map((_, i) => i < Math.floor(rating) ? 1 : 0);
  }

 

private markFormGroupTouched(formGroup: FormGroup): void {
  Object.keys(formGroup.controls).forEach(key => {
    const control = formGroup.get(key);
    control?.markAsTouched();
  });
}

// Add helper methods for offer management:
formatOfferBudget(offer: OfferDto): string {
  return this.offerService.formatBudget(offer.budgetAmount, offer.budgetType);
}

getOfferStatusColor(status: OfferStatus): string {
  return this.offerService.getStatusColor(status);
}

getOfferStatusLabel(status: OfferStatus): string {
  return this.offerService.getStatusLabel(status);
}

cancelOffer(offer: OfferDto): void {
  if (confirm(`Are you sure you want to cancel the offer "${offer.title}"?`)) {
    this.offerService.cancelOffer(offer.offerId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          console.log('✅ Offer cancelled successfully');
          this.loadOffers(); // Refresh offers list
          alert('Offer cancelled successfully!');
        },
        error: (error) => {
          console.error('❌ Error cancelling offer:', error);
          alert('Error cancelling offer: ' + error);
        }
      });
  }
}

  // ✅ Computed properties
  get filteredProjects(): ProjectDto[] {
    let filtered = [...this.projects];
    
    if (this.selectedProjectStatusFilter) {
      filtered = filtered.filter(project => project.status === this.selectedProjectStatusFilter);
    }
    
    return filtered;
  }

  get filteredApplications(): ApplicationDto[] {
    let filtered = [...this.applications];
    
    if (this.selectedProjectFilter) {
      filtered = filtered.filter(app => app.projectId.toString() === this.selectedProjectFilter);
    }
    
    if (this.selectedStatusFilter) {
      filtered = filtered.filter(app => app.status === this.selectedStatusFilter);
    }
    
    return filtered;
  }

  getProjectTitle(projectId: number): string {
    const project = this.projects.find(p => p.id === projectId);
    return project ? project.title : 'Unknown Project';
  }

  // ✅ Form validation helpers
  isFieldInvalid(fieldName: string, form: FormGroup = this.offerForm): boolean {
    const field = form.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getErrorMessage(fieldName: string, form: FormGroup = this.offerForm): string {
    const control = form.get(fieldName);
    if (control?.hasError('required')) {
      return 'This field is required';
    }
    if (control?.hasError('minlength')) {
      const minLength = control.errors?.['minlength']?.requiredLength;
      return `Minimum ${minLength} characters required`;
    }
    if (control?.hasError('min')) {
      return 'Value must be greater than 0';
    }
    return '';
  }

  // ✅ Navigation methods
  navigateToWorkspace(projectId: string): void {
    this.router.navigate(['/workspace', projectId]);
  }

  navigateToProjectPosting(): void {
    this.router.navigate(['/project-posting']);
  }

  // ✅ Ongoing projects methods
  getOngoingProjectStatusColor(status: string): string {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100';
      case 'paused': return 'text-yellow-600 bg-yellow-100';
      case 'completed': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  }

  getDaysRemaining(deadline: Date): number {
    const today = new Date();
    const timeDiff = deadline.getTime() - today.getTime();
    return Math.ceil(timeDiff / (1000 * 3600 * 24));
  }

  // ✅ Menu toggle
  toggleProjectMenu(projectId: number): void {
    this.showProjectMenu = this.showProjectMenu === projectId ? null : projectId;
  }

  // ✅ Click outside handler
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.relative')) {
      this.showProjectMenu = null;
    }
  }
}