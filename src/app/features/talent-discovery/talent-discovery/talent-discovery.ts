import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';
import { TalentProfile, TalentDiscoveryService, SearchFilters } from '../talent-discovery';
import { TranslateModule, TranslatePipe, TranslateService } from '@ngx-translate/core';
import { Project } from '../../../shared/models/project';
import { SharedNavbar, NavbarConfig } from '../../../shared/components/shared-navbar/shared-navbar';
import { SharedFooter } from '../../../shared/components/shared-footer/shared-footer';

@Component({
  selector: 'app-talent-discovery',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TranslateModule,
    SharedNavbar,
    SharedFooter,
  ],
  templateUrl: './talent-discovery.html',
  styleUrl: './talent-discovery.scss'
})
export class TalentDiscovery implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  // Navbar configuration
  navbarConfig: NavbarConfig = {
    title: 'talentDiscovery.title',
    showLanguageToggle: true,
    showProfileLink: true,
    showLogoutButton: true,
    customButtons: [
      {
        label: 'talentDiscovery.navbar.postProject',
        route: '/project-posting',
        class: 'px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors duration-200'
      }
    ]
  };
  
  searchForm!: FormGroup;
  projectAssignForm!: FormGroup;
  talents: TalentProfile[] = [];
  filteredTalents: TalentProfile[] = [];
  shortlistedTalents: string[] = [];
  isLoading = false;
  showFilters = false;
  activeView: 'search' | 'shortlist' = 'search';
  
  // Project Assignment Modal
  showProjectModal = false;
  selectedTalent: TalentProfile | null = null;
  clientProjects: Project[] = []; // This would normally come from a service
  
  // Filter options
  availableSkills: string[] = [];
  selectedSkills: string[] = [];
  
  talentTypeOptions = [
    { value: 'freelancer', label: 'talentTypes.freelancer', icon: '👤' },
    { value: 'service_company', label: 'talentTypes.service_company', icon: '🏢' }
  ];
  
  availabilityOptions = [
    { value: 'available', label: 'availabilityStatus.available', color: 'text-green-600 bg-green-100' },
    { value: 'busy', label: 'availabilityStatus.busy', color: 'text-yellow-600 bg-yellow-100' },
    { value: 'unavailable', label: 'availabilityStatus.unavailable', color: 'text-red-600 bg-red-100' }
  ];
  
  ratingOptions = [
    { value: 0, label: 'anyRating' },
    { value: 3, label: '3+ stars' },
    { value: 4, label: '4+ stars' },
    { value: 4.5, label: '4.5+ stars' }
  ];

  // Pagination
  currentPage = 1;
  itemsPerPage = 6;
  totalPages = 1;
  Math = Math;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private talentService: TalentDiscoveryService,
    public translate: TranslateService
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    this.initializeProjectAssignForm();
    this.loadInitialData();
    this.setupFormSubscriptions();
    this.loadShortlist();
    this.loadClientProjects();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  initializeForm(): void {
    this.searchForm = this.fb.group({
      keyword: [''],
      talentTypes: [[]],
      skills: [[]],
      availability: [[]],
      minRating: [0],
      verifiedOnly: [false],
      minHourlyRate: [''],
      maxHourlyRate: [''],
      location: ['']
    });
  }

  getAvailabilityLabel(availabilityValue: string): string {
    const option = this.availabilityOptions.find(opt => opt.value === availabilityValue);
    return option ? this.translate.instant(option.label) : this.translate.instant('unknown');
  }

  loadInitialData(): void {
    this.availableSkills = this.talentService.getAvailableSkills();
    this.searchTalents();
  }

  setupFormSubscriptions(): void {
    this.searchForm.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.searchTalents();
      });
  }

  loadShortlist(): void {
    this.talentService.shortlist$
      .pipe(takeUntil(this.destroy$))
      .subscribe(shortlist => {
        this.shortlistedTalents = shortlist;
      });
  }

  searchTalents(): void {
    this.isLoading = true;
    const filters: SearchFilters = this.searchForm.value;
    
    this.talentService.searchTalents(filters)
      .pipe(takeUntil(this.destroy$))
      .subscribe(talents => {
        this.talents = talents;
        this.updatePagination();
        this.isLoading = false;
      });
  }

  updatePagination(): void {
    this.totalPages = Math.ceil(this.talents.length / this.itemsPerPage);
    this.currentPage = 1;
    this.updateFilteredTalents();
  }

  updateFilteredTalents(): void {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.filteredTalents = this.talents.slice(startIndex, endIndex);
  }

  toggleTalentType(type: string): void {
    const currentTypes = this.searchForm.get('talentTypes')?.value || [];
    const index = currentTypes.indexOf(type);
    
    if (index > -1) {
      currentTypes.splice(index, 1);
    } else {
      currentTypes.push(type);
    }
    
    this.searchForm.patchValue({ talentTypes: currentTypes });
  }

  toggleSkill(skill: string): void {
    const currentSkills = this.searchForm.get('skills')?.value || [];
    const index = currentSkills.indexOf(skill);
    
    if (index > -1) {
      currentSkills.splice(index, 1);
      this.selectedSkills.splice(this.selectedSkills.indexOf(skill), 1);
    } else {
      currentSkills.push(skill);
      this.selectedSkills.push(skill);
    }
    
    this.searchForm.patchValue({ skills: currentSkills });
  }

  toggleAvailability(availability: string): void {
    const currentAvailability = this.searchForm.get('availability')?.value || [];
    const index = currentAvailability.indexOf(availability);
    
    if (index > -1) {
      currentAvailability.splice(index, 1);
    } else {
      currentAvailability.push(availability);
    }
    
    this.searchForm.patchValue({ availability: currentAvailability });
  }

  clearFilters(): void {
    this.searchForm.reset({
      keyword: '',
      talentTypes: [],
      skills: [],
      availability: [],
      minRating: 0,
      verifiedOnly: false,
      minHourlyRate: '',
      maxHourlyRate: '',
      location: ''
    });
    this.selectedSkills = [];
  }

  toggleShortlist(talent: TalentProfile): void {
    if (this.isInShortlist(talent.id)) {
      this.talentService.removeFromShortlist(talent.id);
    } else {
      this.talentService.addToShortlist(talent.id);
    }
  }

  isInShortlist(talentId: string): boolean {
    return this.talentService.isInShortlist(talentId);
  }

  loadShortlistedTalents(): void {
    this.isLoading = true;
    this.talentService.getShortlistedTalents()
      .pipe(takeUntil(this.destroy$))
      .subscribe(talents => {
        this.talents = talents;
        this.updatePagination();
        this.isLoading = false;
      });
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updateFilteredTalents();
    }
  }

  getPaginationArray(): number[] {
    return Array(this.totalPages).fill(0).map((_, i) => i + 1);
  }

  switchView(view: 'search' | 'shortlist'): void {
    this.activeView = view;
    if (view === 'shortlist') {
      this.loadShortlistedTalents();
    } else {
      this.searchTalents();
    }
  }

  viewTalentProfile(talent: TalentProfile): void {
    this.router.navigate(['/profile', talent.username]);
  }

  contactTalent(talent: TalentProfile): void {
    alert(this.translate.instant('contactAlert', { name: `${talent.firstName} ${talent.lastName}` }));
  }

  getStarArray(rating: number): number[] {
    return Array(5).fill(0).map((_, i) => i < Math.floor(rating) ? 1 : 0);
  }

  getAvailabilityColor(availability: string): string {
    const option = this.availabilityOptions.find(opt => opt.value === availability);
    return option ? option.color : 'text-gray-600 bg-gray-100';
  }

  formatDate(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return this.translate.instant('timeAgo.today');
    if (diffDays === 1) return this.translate.instant('timeAgo.yesterday');
    if (diffDays < 7) return this.translate.instant('timeAgo.daysAgo', { days: diffDays });
    if (diffDays < 30) return this.translate.instant('timeAgo.weeksAgo', { weeks: Math.floor(diffDays / 7) });
    
    return new Intl.DateTimeFormat(this.translate.currentLang === 'fr' ? 'fr-FR' : 'en-US').format(date);
  }

  getSelectedFiltersCount(): number {
    const formValue = this.searchForm.value;
    let count = 0;
    
    if (formValue.keyword?.trim()) count++;
    if (formValue.talentTypes?.length > 0) count++;
    if (formValue.skills?.length > 0) count++;
    if (formValue.availability?.length > 0) count++;
    if (formValue.minRating > 0) count++;
    if (formValue.verifiedOnly) count++;
    if (formValue.minHourlyRate) count++;
    if (formValue.maxHourlyRate) count++;
    if (formValue.location?.trim()) count++;
    
    return count;
  }

  toggleFilters(): void {
    this.showFilters = !this.showFilters;
  }

  initializeProjectAssignForm(): void {
    this.projectAssignForm = this.fb.group({
      projectId: ['', Validators.required],
      message: ['', Validators.required],
      deadline: [''],
      budget: ['']
    });
  }

  loadClientProjects(): void {
    // Mock client projects - in real app, this would come from a service
    this.clientProjects = [
      {
        id: '1',
        title: 'E-commerce Website Development',
        description: 'Build a modern e-commerce platform with React and Node.js',
        clientId: 'client1',
        clientName: 'John Doe',
        clientRating: 4.8,
        clientReviews: 25,
        category: 'web-development' as any,
        skills: ['React', 'Node.js', 'MongoDB'],
        budget: { type: 'fixed', min: 2000, max: 5000, currency: 'EUR', isNegotiable: true },
        timeline: { duration: '2-3 months', isFlexible: true },
        complexity: 'intermediate',
        proposals: 12,
        status: 'open' as any,
        postedDate: new Date(),
        isRemote: true,
        isUrgent: false,
        isFeatured: false,
        projectType: 'fixed',
        preferredTalentType: 'both',
        experienceLevel: 'intermediate'
      },
      {
        id: '2',
        title: 'Mobile App UI/UX Design',
        description: 'Design a modern and intuitive mobile app interface',
        clientId: 'client1',
        clientName: 'John Doe',
        clientRating: 4.8,
        clientReviews: 25,
        category: 'design' as any,
        skills: ['UI/UX Design', 'Figma', 'Mobile Design'],
        budget: { type: 'fixed', min: 1000, max: 3000, currency: 'EUR', isNegotiable: true },
        timeline: { duration: '1 month', isFlexible: false },
        complexity: 'intermediate',
        proposals: 8,
        status: 'open' as any,
        postedDate: new Date(),
        isRemote: true,
        isUrgent: true,
        isFeatured: false,
        projectType: 'fixed',
        preferredTalentType: 'freelancer',
        experienceLevel: 'intermediate'
      }
    ];
  }

  openProjectAssignModal(talent: TalentProfile): void {
    this.selectedTalent = talent;
    this.showProjectModal = true;
    this.projectAssignForm.reset();
  }

  closeProjectAssignModal(): void {
    this.showProjectModal = false;
    this.selectedTalent = null;
    this.projectAssignForm.reset();
  }

  assignProjectToTalent(): void {
    if (this.projectAssignForm.valid && this.selectedTalent) {
      const formValue = this.projectAssignForm.value;
      const selectedProject = this.clientProjects.find(p => p.id === formValue.projectId);
      
      if (selectedProject) {
        // In a real app, this would make an API call to assign the project
        const assignmentData = {
          talentId: this.selectedTalent.id,
          projectId: formValue.projectId,
          message: formValue.message,
          deadline: formValue.deadline,
          budget: formValue.budget
        };
        
        console.log('Assigning project to talent:', assignmentData);
        
        // Show success message
        alert(this.translate.instant('talentDiscovery.projectAssignment.successMessage', {
          talentName: `${this.selectedTalent.firstName} ${this.selectedTalent.lastName}`,
          projectTitle: selectedProject.title
        }));
        
        this.closeProjectAssignModal();
      }
    }
  }
}