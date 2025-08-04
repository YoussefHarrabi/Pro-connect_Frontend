import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { Application, Offer } from '../../../shared/models/application';
import { Project } from '../../../shared/models/project';
import { ApplicationService } from '../../../shared/services/application.service';
import { ProjectMarketplaceService } from '../../../shared/services/project-marketplace.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { SharedNavbar, NavbarConfig } from '../../../shared/components/shared-navbar/shared-navbar';
import { SharedFooter } from '../../../shared/components/shared-footer/shared-footer';

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
  
  activeTab: 'projects' | 'applications' | 'offers' | 'ongoing' = 'applications';
  
  navbarConfig: NavbarConfig = {
    title: 'clientDashboard.header.title',
    showLanguageToggle: true,
    showProfileLink: true,
    customButtons: [
      {
        label: 'clientDashboard.header.postProject',
        route: '/project-posting',
        class: 'px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors duration-200'
      }
    ]
  };
  projects: Project[] = [];
  applications: Application[] = [];
  offers: Offer[] = [];
  ongoingProjects: OngoingProject[] = [];
  isLoading = false;
  
  // Modal states
  showApplicationModal = false;
  showOfferModal = false;
  selectedApplication: Application | null = null;
  selectedProject: Project | null = null;
  
  // Offer form
  offerForm!: FormGroup;
  
  // Filters
  selectedProjectFilter = '';
  selectedStatusFilter = '';

  Math = Math;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private applicationService: ApplicationService,
    private projectService: ProjectMarketplaceService,
    private translate: TranslateService
  ) {}

  ngOnInit(): void {
    this.initializeOfferForm();
    this.loadData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  initializeOfferForm(): void {
    this.offerForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(5)]],
      description: ['', [Validators.required, Validators.minLength(20)]],
      budgetAmount: ['', [Validators.required, Validators.min(1)]],
      budgetType: ['fixed', Validators.required],
      timeline: ['', Validators.required],
      startDate: [''],
      terms: ['', [Validators.required, Validators.minLength(50)]]
    });
  }

  loadData(): void {
    this.isLoading = true;
    
    // Load applications
    this.applicationService.getAllApplications()
      .pipe(takeUntil(this.destroy$))
      .subscribe(applications => {
        this.applications = applications;
        this.isLoading = false;
      });

    // Load client's offers
    this.applicationService.getOffersByClient('current-client-id')
      .pipe(takeUntil(this.destroy$))
      .subscribe(offers => {
        this.offers = offers;
      });

    // Load projects (mock client projects)
    this.projectService.searchProjects({})
      .pipe(takeUntil(this.destroy$))
      .subscribe(projects => {
        this.projects = projects.slice(0, 3); // Mock client's projects
      });

    // Load ongoing projects (mock data)
    this.loadOngoingProjects();
  }

  loadOngoingProjects(): void {
    // Mock ongoing projects data
    this.ongoingProjects = [
      {
        id: 'ongoing-1',
        title: 'E-commerce Website Development',
        description: 'Building a modern e-commerce platform with React and Node.js',
        freelancerName: 'Sarah Johnson',
        freelancerId: 'freelancer-001',
        budget: 5000,
        startDate: new Date('2024-01-15'),
        deadline: new Date('2024-03-15'),
        status: 'active',
        progress: 65
      },
      {
        id: 'ongoing-2',
        title: 'Mobile App UI/UX Design',
        description: 'Complete mobile app design for iOS and Android platforms',
        freelancerName: 'Alex Thompson',
        freelancerId: 'freelancer-002',
        budget: 3000,
        startDate: new Date('2024-02-01'),
        deadline: new Date('2024-04-01'),
        status: 'active',
        progress: 40
      },
      {
        id: 'ongoing-3',
        title: 'WordPress Website Migration',
        description: 'Migrating existing website to WordPress with custom theme',
        freelancerName: 'Maria Garcia',
        freelancerId: 'freelancer-003',
        budget: 2000,
        startDate: new Date('2024-01-20'),
        deadline: new Date('2024-02-20'),
        status: 'completed',
        progress: 100
      }
    ];
  }

  switchTab(tab: 'projects' | 'applications' | 'offers' | 'ongoing'): void {
    this.activeTab = tab;
  }

  openApplicationModal(application: Application): void {
    this.selectedApplication = application;
    this.selectedProject = this.projects.find(p => p.id === application.projectId) || null;
    this.showApplicationModal = true;
    document.body.style.overflow = 'hidden';
  }

  closeApplicationModal(): void {
    this.showApplicationModal = false;
    this.selectedApplication = null;
    this.selectedProject = null;
    document.body.style.overflow = 'auto';
  }

  openOfferModal(application: Application): void {
    this.selectedApplication = application;
    this.selectedProject = this.projects.find(p => p.id === application.projectId) || null;
    
    // Pre-fill form with project data
    if (this.selectedProject) {
      this.offerForm.patchValue({
        title: `Offer for: ${this.selectedProject.title}`,
        budgetAmount: application.proposedBudget || this.selectedProject.budget.min,
        budgetType: this.selectedProject.budget.type,
        timeline: application.proposedTimeline || this.selectedProject.timeline.duration
      });
    }
    
    this.showOfferModal = true;
    document.body.style.overflow = 'hidden';
  }

  closeOfferModal(): void {
    this.showOfferModal = false;
    this.selectedApplication = null;
    this.selectedProject = null;
    this.offerForm.reset();
    document.body.style.overflow = 'auto';
  }

  updateApplicationStatus(application: Application, status: Application['status']): void {
    this.applicationService.updateApplicationStatus(application.id, status)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        application.status = status;
        application.reviewedDate = new Date();
      });
  }

  sendOffer(): void {
    if (this.offerForm.valid && this.selectedApplication && this.selectedProject) {
      this.isLoading = true;
      
      const offerData = {
        projectId: this.selectedProject.id,
        applicationId: this.selectedApplication.id,
        clientId: 'current-client-id',
        talentId: this.selectedApplication.talentId,
        title: this.offerForm.value.title,
        description: this.offerForm.value.description,
        budget: {
          amount: this.offerForm.value.budgetAmount,
          type: this.offerForm.value.budgetType,
          currency: 'EUR' as const
        },
        timeline: this.offerForm.value.timeline,
        startDate: this.offerForm.value.startDate ? new Date(this.offerForm.value.startDate) : undefined,
        terms: this.offerForm.value.terms
      };

      this.applicationService.createOffer(offerData)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (offer) => {
            this.offers.push(offer);
            this.selectedApplication!.status = 'offered';
            this.closeOfferModal();
            this.isLoading = false;
            alert('Offer sent successfully!');
          },
          error: (error) => {
            console.error('Error sending offer:', error);
            this.isLoading = false;
            alert('Error sending offer. Please try again.');
          }
        });
    }
  }

  getStarArray(rating: number): number[] {
    return Array(5).fill(0).map((_, i) => i < Math.floor(rating) ? 1 : 0);
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'reviewed': return 'text-blue-600 bg-blue-100';
      case 'shortlisted': return 'text-purple-600 bg-purple-100';
      case 'offered': return 'text-green-600 bg-green-100';
      case 'rejected': return 'text-red-600 bg-red-100';
      case 'hired': return 'text-green-800 bg-green-200';
      case 'sent': return 'text-blue-600 bg-blue-100';
      case 'accepted': return 'text-green-600 bg-green-100';
      case 'declined': return 'text-red-600 bg-red-100';
      case 'expired': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  }

  formatDate(date: Date): string {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  }

  get filteredApplications(): Application[] {
    let filtered = [...this.applications];
    
    if (this.selectedProjectFilter) {
      filtered = filtered.filter(app => app.projectId === this.selectedProjectFilter);
    }
    
    if (this.selectedStatusFilter) {
      filtered = filtered.filter(app => app.status === this.selectedStatusFilter);
    }
    
    return filtered;
  }

  getProjectTitle(projectId: string): string {
    const project = this.projects.find(p => p.id === projectId);
    return project ? project.title : 'Unknown Project';
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.offerForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getErrorMessage(fieldName: string): string {
    const control = this.offerForm.get(fieldName);
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

  // Navigate to workspace for ongoing project
  navigateToWorkspace(projectId: string): void {
    this.router.navigate(['/workspace', projectId]);
  }

  // Accept application and move project to ongoing
  acceptApplication(application: Application): void {
    // Find the related project
    const project = this.projects.find(p => p.id === application.projectId);
    if (!project) return;

    // Create ongoing project
    const ongoingProject: OngoingProject = {
      id: `ongoing-${Date.now()}`,
      title: project.title,
      description: project.description,
      freelancerName: application.talentName,
      freelancerId: application.talentId,
      budget: application.proposedBudget || project.budget.min || 0,
      startDate: new Date(),
      deadline: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days from now
      status: 'active',
      progress: 0
    };

    // Add to ongoing projects
    this.ongoingProjects.unshift(ongoingProject);

    // Update application status
    application.status = 'offered';

    // Close modal and show success message
    this.closeApplicationModal();
    
    // You can add a toast notification here if you have a notification service
    console.log(`Application accepted! Project "${project.title}" is now ongoing.`);
  }

  // Get status color for ongoing projects
  getOngoingProjectStatusColor(status: string): string {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100';
      case 'paused': return 'text-yellow-600 bg-yellow-100';
      case 'completed': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  }

  // Calculate days remaining for ongoing project
  getDaysRemaining(deadline: Date): number {
    const today = new Date();
    const timeDiff = deadline.getTime() - today.getTime();
    return Math.ceil(timeDiff / (1000 * 3600 * 24));
  }
}