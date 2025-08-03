import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Project } from '../../../shared/models/project';
import { SharedNavbar, NavbarConfig } from '../../../shared/components/shared-navbar/shared-navbar';
import { SharedFooter } from '../../../shared/components/shared-footer/shared-footer';

export interface ProjectOffer {
  id: string;
  projectId: string;
  project: Project;
  clientId: string;
  clientName: string;
  clientRating: number;
  clientReviews: number;
  talentId: string;
  message: string;
  proposedBudget?: number;
  proposedDeadline?: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  sentDate: Date;
  responseDate?: Date;
  expiresAt: Date;
  terms?: string;
}

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

  offers: ProjectOffer[] = [];
  filteredOffers: ProjectOffer[] = [];
  isLoading = false;
  activeTab: 'pending' | 'responded' | 'all' = 'pending';
  
  navbarConfig: NavbarConfig = {
    title: 'projectOffers.header.title',
    showLanguageToggle: true,
    showProfileLink: true,
    customButtons: [
      {
        label: 'projectOffers.header.browseProjects',
        route: '/project-discovery',
        class: 'px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors duration-200'
      }
    ]
  };
  
  // Response Modal
  showResponseModal = false;
  selectedOffer: ProjectOffer | null = null;
  responseForm!: FormGroup;
  responseType: 'accept' | 'decline' | null = null;

  Math = Math;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private translate: TranslateService
  ) {
    // Set default language for translation service
    this.translate.setDefaultLang('en');
    this.translate.use('en');
  }

  ngOnInit(): void {
    this.initializeResponseForm();
    this.loadOffers();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  initializeResponseForm(): void {
    this.responseForm = this.fb.group({
      message: ['', [Validators.required, Validators.minLength(20)]],
      counterBudget: [''],
      counterDeadline: [''],
      additionalTerms: ['']
    });
  }

  loadOffers(): void {
    this.isLoading = true;
    
    // Mock data - in real app, this would come from a service
    this.offers = [
      {
        id: 'offer1',
        projectId: '1',
        project: {
          id: '1',
          title: 'E-commerce Website Development',
          description: 'Build a modern e-commerce platform with React and Node.js. The website should include user authentication, product catalog, shopping cart, payment integration, and admin dashboard.',
          clientId: 'client1',
          clientName: 'John Doe',
          clientRating: 4.8,
          clientReviews: 25,
          category: 'web-development' as any,
          skills: ['React', 'Node.js', 'MongoDB', 'Payment Integration'],
          budget: { type: 'fixed', min: 4000, max: 6000, currency: 'EUR', isNegotiable: true },
          timeline: { duration: '2-3 months', isFlexible: true },
          complexity: 'intermediate',
          proposals: 12,
          status: 'open' as any,
          postedDate: new Date(2025, 0, 15),
          isRemote: true,
          isUrgent: false,
          isFeatured: true,
          projectType: 'fixed',
          preferredTalentType: 'both',
          experienceLevel: 'intermediate'
        },
        clientId: 'client1',
        clientName: 'John Doe',
        clientRating: 4.8,
        clientReviews: 25,
        talentId: 'talent1',
        message: 'Hi! I reviewed your profile and I\'m impressed with your React and Node.js experience. I would like to invite you to work on my e-commerce project. The timeline is flexible and I\'m open to discussing the budget.',
        proposedBudget: 5000,
        proposedDeadline: '2025-04-01',
        status: 'pending',
        sentDate: new Date(2025, 0, 28),
        expiresAt: new Date(2025, 1, 4), // 7 days from sent date
        terms: 'Payment will be made in milestones: 30% upfront, 40% after backend completion, 30% after final delivery.'
      },
      {
        id: 'offer2',
        projectId: '2',
        project: {
          id: '2',
          title: 'Mobile App UI/UX Design',
          description: 'Design a modern and intuitive mobile app interface for a fitness tracking application. Should include onboarding, workout tracking, progress charts, and social features.',
          clientId: 'client2',
          clientName: 'Sarah Wilson',
          clientRating: 4.9,
          clientReviews: 18,
          category: 'design' as any,
          skills: ['UI/UX Design', 'Figma', 'Mobile Design', 'Prototyping'],
          budget: { type: 'fixed', min: 2000, max: 3500, currency: 'EUR', isNegotiable: true },
          timeline: { duration: '1 month', isFlexible: false },
          complexity: 'intermediate',
          proposals: 8,
          status: 'open' as any,
          postedDate: new Date(2025, 0, 20),
          isRemote: true,
          isUrgent: true,
          isFeatured: false,
          projectType: 'fixed',
          preferredTalentType: 'freelancer',
          experienceLevel: 'intermediate'
        },
        clientId: 'client2',
        clientName: 'Sarah Wilson',
        clientRating: 4.9,
        clientReviews: 18,
        talentId: 'talent1',
        message: 'Hello! Your design portfolio caught my attention, especially your mobile app designs. I have an urgent project that needs to be completed within a month. Are you available?',
        proposedBudget: 2800,
        proposedDeadline: '2025-03-01',
        status: 'pending',
        sentDate: new Date(2025, 0, 29),
        expiresAt: new Date(2025, 1, 5),
        terms: 'Fast turnaround required. Payment: 50% upfront, 50% on delivery.'
      },
      {
        id: 'offer3',
        projectId: '3',
        project: {
          id: '3',
          title: 'API Development for SaaS Platform',
          description: 'Develop RESTful APIs for a SaaS platform with authentication, data management, and third-party integrations.',
          clientId: 'client3',
          clientName: 'Tech Innovations Inc.',
          clientRating: 4.7,
          clientReviews: 42,
          category: 'backend-development' as any,
          skills: ['Node.js', 'Express', 'PostgreSQL', 'JWT', 'API Design'],
          budget: { type: 'hourly', min: 45, max: 65, currency: 'EUR', isNegotiable: false },
          timeline: { duration: '6 weeks', isFlexible: true },
          complexity: 'expert',
          proposals: 15,
          status: 'open' as any,
          postedDate: new Date(2025, 0, 10),
          isRemote: true,
          isUrgent: false,
          isFeatured: true,
          projectType: 'hourly',
          preferredTalentType: 'both',
          experienceLevel: 'expert'
        },
        clientId: 'client3',
        clientName: 'Tech Innovations Inc.',
        clientRating: 4.7,
        clientReviews: 42,
        talentId: 'talent1',
        message: 'We need an experienced backend developer for our SaaS platform. Your expertise in Node.js and API development makes you a perfect fit. This is a long-term opportunity.',
        status: 'accepted',
        sentDate: new Date(2025, 0, 25),
        responseDate: new Date(2025, 0, 26),
        expiresAt: new Date(2025, 1, 1)
      }
    ];

    this.filterOffers();
    this.isLoading = false;
  }

  switchTab(tab: 'pending' | 'responded' | 'all'): void {
    this.activeTab = tab;
    this.filterOffers();
  }

  filterOffers(): void {
    switch (this.activeTab) {
      case 'pending':
        this.filteredOffers = this.offers.filter(offer => offer.status === 'pending');
        break;
      case 'responded':
        this.filteredOffers = this.offers.filter(offer => 
          offer.status === 'accepted' || offer.status === 'declined'
        );
        break;
      case 'all':
        this.filteredOffers = [...this.offers];
        break;
    }
  }

  openResponseModal(offer: ProjectOffer, type: 'accept' | 'decline'): void {
    this.selectedOffer = offer;
    this.responseType = type;
    this.showResponseModal = true;
    this.responseForm.reset();
    
    // Pre-fill form for acceptance
    if (type === 'accept') {
      this.responseForm.patchValue({
        message: `Thank you for choosing me for this project. I'm excited to work on "${offer.project.title}" and deliver high-quality results within the specified timeline.`
      });
    } else {
      this.responseForm.patchValue({
        message: `Thank you for considering me for this project. Unfortunately, I won't be able to take on this project at this time.`
      });
    }

    document.body.style.overflow = 'hidden';
  }

  closeResponseModal(): void {
    this.showResponseModal = false;
    this.selectedOffer = null;
    this.responseType = null;
    this.responseForm.reset();
    document.body.style.overflow = 'auto';
  }

  submitResponse(): void {
    if (this.responseForm.valid && this.selectedOffer && this.responseType) {
      const formValue = this.responseForm.value;
      
      // Update offer status
      this.selectedOffer.status = this.responseType === 'accept' ? 'accepted' : 'declined';
      this.selectedOffer.responseDate = new Date();

      // In real app, this would make an API call
      const responseData = {
        offerId: this.selectedOffer.id,
        status: this.selectedOffer.status,
        message: formValue.message,
        counterBudget: formValue.counterBudget,
        counterDeadline: formValue.counterDeadline,
        additionalTerms: formValue.additionalTerms
      };

      console.log('Submitting response:', responseData);

      // Show success message
      const messageKey = this.responseType === 'accept' ? 
        'projectOffers.response.acceptSuccess' : 
        'projectOffers.response.declineSuccess';
      
      alert(this.translate.instant(messageKey, { 
        projectTitle: this.selectedOffer.project.title 
      }));

      this.closeResponseModal();
      this.filterOffers();
    }
  }

  viewProjectDetails(project: Project): void {
    this.router.navigate(['/project-details', project.id]);
  }

  viewClientProfile(clientId: string): void {
    this.router.navigate(['/client-profile', clientId]);
  }

  getStatusColor(status: ProjectOffer['status']): string {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'accepted':
        return 'bg-green-100 text-green-800';
      case 'declined':
        return 'bg-red-100 text-red-800';
      case 'expired':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  isOfferExpired(offer: ProjectOffer): boolean {
    if (!offer || !offer.expiresAt) return false;
    return new Date() > offer.expiresAt && offer.status === 'pending';
  }

  getDaysUntilExpiry(offer: ProjectOffer): number {
    if (!offer || !offer.expiresAt) return 0;
    const now = new Date();
    const diffMs = offer.expiresAt.getTime() - now.getTime();
    return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  }

  formatDate(date: Date): string {
    if (!date) return '';
    return new Intl.DateTimeFormat(this.translate.currentLang === 'fr' ? 'fr-FR' : 'en-US').format(date);
  }

  formatDateString(dateString: string): string {
    if (!dateString) return '';
    return this.formatDate(new Date(dateString));
  }

  getStarArray(rating: number): number[] {
    if (!rating || rating < 0) return Array(5).fill(0);
    return Array(5).fill(0).map((_, i) => i < Math.floor(rating) ? 1 : 0);
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.responseForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getErrorMessage(fieldName: string): string {
    const control = this.responseForm.get(fieldName);
    if (control?.hasError('required')) {
      return this.translate.instant('projectOffers.validation.required');
    }
    if (control?.hasError('minlength')) {
      const minLength = control.errors?.['minlength']?.requiredLength;
      return this.translate.instant('projectOffers.validation.minLength', { minLength });
    }
    return '';
  }

  getPendingCount(): number {
    return this.offers ? this.offers.filter(offer => offer.status === 'pending').length : 0;
  }

  getRespondedCount(): number {
    return this.offers ? this.offers.filter(offer => offer.status === 'accepted' || offer.status === 'declined').length : 0;
  }
}
