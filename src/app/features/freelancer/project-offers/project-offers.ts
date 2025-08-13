import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ApplicationService, ApplicationDto, ApplicationStatus } from '../../../shared/services/application.service';
import { SharedNavbar, NavbarConfig } from '../../../shared/components/shared-navbar/shared-navbar';
import { SharedFooter } from '../../../shared/components/shared-footer/shared-footer';

@Component({
  selector: 'app-project-offers',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TranslateModule,
    RouterModule,
    SharedNavbar,
    SharedFooter,
  ],
  templateUrl: './project-offers.html',
  styleUrl: './project-offers.scss'
})
export class ProjectOffers implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  applications: ApplicationDto[] = [];
  filteredApplications: ApplicationDto[] = [];
  isLoading = false;
  activeTab: 'pending' | 'under_review' | 'accepted' | 'rejected' | 'all' = 'pending';
  
  navbarConfig: NavbarConfig = {
    title: 'My Applications',
    showLanguageToggle: true,
    showProfileLink: true,
    customButtons: [
      {
        label: 'Browse Projects',
        route: '/project-discovery',
        class: 'px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors duration-200'
      }
    ]
  };
  
  // Details Modal
  showDetailsModal = false;
  selectedApplication: ApplicationDto | null = null;

  Math = Math;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private translate: TranslateService,
    private applicationService: ApplicationService
  ) {
    this.translate.setDefaultLang('en');
    this.translate.use('en');
  }

  ngOnInit(): void {
    this.loadApplications();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadApplications(): void {
    this.isLoading = true;
    
    this.applicationService.getMyApplications()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (applications) => {
          console.log('✅ Loaded applications:', applications);
          this.applications = applications;
          this.filterApplications();
          this.isLoading = false;
        },
        error: (error) => {
          console.error('❌ Error loading applications:', error);
          this.isLoading = false;
          // Show mock data for testing
          this.loadMockApplications();
        }
      });
  }

  // Mock data for testing
  loadMockApplications(): void {
    this.applications = [
      {
        id: 1,
        projectId: 1,
        projectTitle: 'E-commerce Website Development',
        applicantUsername: 'iskander25',
        coverLetter: 'Dear Client,\n\nI am excited to apply for your e-commerce website development project. With over 5 years of experience in React and Node.js development, I have successfully delivered numerous e-commerce platforms with features including user authentication, payment integration, and admin dashboards.\n\nMy approach would be to start with a detailed project analysis, followed by creating wireframes and then developing the platform using modern technologies. I ensure clean, maintainable code and comprehensive testing.\n\nI am confident I can deliver a high-quality solution within your timeline and budget.\n\nBest regards,\nIskander',
        proposedBudget: 4500,
        proposedTimeline: '2.5 months',
        hourlyRate: 65,
        additionalQuestions: 'I would like to know more about the specific payment gateways you prefer and any existing design guidelines.',
        attachmentPaths: 'portfolio_showcase.pdf,previous_ecommerce_examples.pdf',
        selectedPortfolioItems: undefined,
        status: ApplicationStatus.UNDER_REVIEW,
        createdAt: '2025-01-28T10:30:00Z'
      },
      {
        id: 2,
        projectId: 2,
        projectTitle: 'Mobile App UI/UX Design',
        applicantUsername: 'iskander25',
        coverLetter: 'Hello,\n\nI noticed your urgent mobile app design project and I am available to start immediately. While my primary expertise is in full-stack development, I have strong design skills and experience with Figma and modern UI/UX principles.\n\nI can deliver the complete design within 3 weeks, including all screens, prototypes, and design assets ready for development.\n\nLooking forward to working with you!',
        proposedBudget: 2200,
        proposedTimeline: '3 weeks',
        hourlyRate: undefined,
        additionalQuestions: 'Do you have any existing brand guidelines or color preferences?',
        attachmentPaths: 'design_portfolio.pdf',
        selectedPortfolioItems: undefined,
        status: ApplicationStatus.REJECTED,
        createdAt: '2025-01-29T14:15:00Z'
      },
      {
        id: 3,
        projectId: 3,
        projectTitle: 'API Development for SaaS Platform',
        applicantUsername: 'iskander25',
        coverLetter: 'Dear Tech Innovations Inc.,\n\nI am thrilled to apply for your API development project. This aligns perfectly with my expertise in Node.js, Express, and PostgreSQL. I have developed numerous RESTful APIs for SaaS platforms, including authentication systems, data management, and third-party integrations.\n\nMy experience includes:\n- JWT authentication and authorization\n- Database design and optimization\n- API documentation with Swagger\n- Automated testing and deployment\n\nI am excited about the long-term opportunity and can start immediately.\n\nBest regards,\nIskander',
        proposedBudget: 0, // Hourly project
        proposedTimeline: '6 weeks',
        hourlyRate: 58,
        additionalQuestions: 'I would appreciate more details about the specific third-party integrations required and the expected API load.',
        attachmentPaths: 'api_documentation_samples.pdf,saas_project_references.pdf',
        selectedPortfolioItems: 'project1,project3',
        status: ApplicationStatus.ACCEPTED,
        createdAt: '2025-01-25T09:20:00Z'
      },
      {
        id: 4,
        projectId: 4,
        projectTitle: 'WordPress Plugin Development',
        applicantUsername: 'iskander25',
        coverLetter: 'Hi there,\n\nI am interested in developing your WordPress plugin. Although WordPress is not my primary specialty, I have experience with PHP and can deliver a functional plugin within your requirements.\n\nI would need some additional time to familiarize myself with WordPress best practices, but I am confident in delivering a quality solution.',
        proposedBudget: 800,
        proposedTimeline: '2 weeks',
        hourlyRate: undefined,
        additionalQuestions: undefined,
        attachmentPaths: undefined,
        selectedPortfolioItems: undefined,
        status: ApplicationStatus.PENDING,
        createdAt: '2025-01-30T16:45:00Z'
      }
    ];
    
    this.filterApplications();
  }

  switchTab(tab: 'pending' | 'under_review' | 'accepted' | 'rejected' | 'all'): void {
    this.activeTab = tab;
    this.filterApplications();
  }

  filterApplications(): void {
    switch (this.activeTab) {
      case 'pending':
        this.filteredApplications = this.applications.filter(app => app.status === ApplicationStatus.PENDING);
        break;
      case 'under_review':
        this.filteredApplications = this.applications.filter(app => 
          app.status === ApplicationStatus.UNDER_REVIEW || app.status === ApplicationStatus.SHORTLISTED
        );
        break;
      case 'accepted':
        this.filteredApplications = this.applications.filter(app => app.status === ApplicationStatus.ACCEPTED);
        break;
      case 'rejected':
        this.filteredApplications = this.applications.filter(app => app.status === ApplicationStatus.REJECTED);
        break;
      case 'all':
        this.filteredApplications = [...this.applications];
        break;
    }
  }

  viewFullApplication(application: ApplicationDto): void {
    this.selectedApplication = application;
    this.showDetailsModal = true;
    document.body.style.overflow = 'hidden';
  }

  closeDetailsModal(): void {
    this.showDetailsModal = false;
    this.selectedApplication = null;
    document.body.style.overflow = 'auto';
  }

  expandCoverLetter(application: ApplicationDto): void {
    this.viewFullApplication(application);
  }

  viewProjectDetails(projectId: number): void {
    this.router.navigate(['/project-details', projectId]);
  }

  withdrawApplication(application: ApplicationDto): void {
    if (confirm('Are you sure you want to withdraw this application? This action cannot be undone.')) {
      this.applicationService.withdrawApplication(application.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            console.log('✅ Application withdrawn successfully');
            this.loadApplications(); // Refresh the list
          },
          error: (error) => {
            console.error('❌ Error withdrawing application:', error);
            alert('Failed to withdraw application. Please try again.');
          }
        });
    }
  }

  canWithdrawApplication(application: ApplicationDto): boolean {
    return this.applicationService.canWithdraw(application.status);
  }

  getStatusColor(status: ApplicationStatus): string {
    return this.applicationService.getStatusColor(status);
  }

  getStatusLabel(status: ApplicationStatus): string {
    return this.applicationService.getStatusLabel(status);
  }

  formatDate(dateString: string): string {
    return this.applicationService.formatDate(dateString);
  }

  getRelativeTime(dateString: string): string {
    return this.applicationService.getRelativeTime(dateString);
  }

  getAttachmentList(attachmentPaths: string | null): string[] {
    if (!attachmentPaths) return [];
    return attachmentPaths.split(',').map(path => path.trim()).filter(path => path.length > 0);
  }

  getPendingCount(): number {
    return this.applications.filter(app => app.status === ApplicationStatus.PENDING).length;
  }

  getUnderReviewCount(): number {
    return this.applications.filter(app => 
      app.status === ApplicationStatus.UNDER_REVIEW || app.status === ApplicationStatus.SHORTLISTED
    ).length;
  }

  getAcceptedCount(): number {
    return this.applications.filter(app => app.status === ApplicationStatus.ACCEPTED).length;
  }

  getRejectedCount(): number {
    return this.applications.filter(app => app.status === ApplicationStatus.REJECTED).length;
  }
}