import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { SharedNavbar, NavbarConfig } from '../../shared/components/shared-navbar/shared-navbar';
import { SharedFooter } from '../../shared/components/shared-footer/shared-footer';
import { UserService } from '../../shared/services/user.service';
import { 
  UserProfileResponse, 
  ProfileUpdateRequest, 
  EducationDto, 
  EducationRequest,
  CertificationDto,
  CertificationRequest,
  ExperienceDto,
  ExperienceRequest,
  ResumeUpdateRequest,
  AvailabilityStatus,
  ERole,
  PortfolioDto,
  SkillDto
} from '../../shared/models/user';
import { PortfolioRequest, ProjectType } from '../../core/dto';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    TranslateModule,
    SharedNavbar,
    SharedFooter
  ],
  templateUrl: './profile.html',
  styleUrl: './profile.scss'
})
export class Profile implements OnInit {
  currentUser: UserProfileResponse | null = null;
  isEditMode = false;
  activeTab = 'overview';
  isPublicView = false;
  profileForm!: FormGroup;
  portfolioForm!: FormGroup;
  educationForm!: FormGroup;
  certificationForm!: FormGroup;
  languagesForm!: FormGroup;
  socialLinksForm!: FormGroup;
  workHistoryForm!: FormGroup;
  skillsForm!: FormGroup;
  isLoading = true;
  currentLanguage = 'en';
  
  // Profile viewing properties
  isViewingOtherProfile = false;
  viewedUsername: string | null = null;
  
  // Resume upload
  selectedResumeFile: File | null = null;
  resumeUploadProgress = 0;
  
  // Portfolio image upload
  selectedPortfolioImage: File | null = null;
  portfolioImagePreview: string | null = null;
  
  // Navbar configuration
  navbarConfig: NavbarConfig = {
    title: 'Pro-Connect',
    showLanguageToggle: true,
    showProfileLink: true,
    showLogoutButton: true
  };
  
  // Modal management
  showPortfolioModal = false;
  showEducationModal = false;
  showCertificationModal = false;
  showLanguagesModal = false;
  showSocialLinksModal = false;
  showWorkHistoryModal = false;
  showSkillsModal = false;
  
  // Skills management
  availableSkills: any[] = [];
  skillCategories: string[] = [];
  selectedSkills: any[] = [];
  searchSkillQuery = '';
  filteredSkills: any[] = [];
  
  // Profile picture management
  selectedProfilePicture: File | null = null;
  profilePicturePreview: string | null = null;
  isUploadingProfilePicture = false;
  
  isEditingPortfolio = false;
  isEditingEducation = false;
  isEditingCertification = false;
  editingPortfolioId: number | null = null;
  editingEducationId: number | null = null;
  editingCertificationId: number | null = null;
  editingPortfolioItem: any = null;
  editingWorkHistory: ExperienceDto | null = null; // Fixed type

  // Make AvailabilityStatus accessible in template
  AvailabilityStatus = AvailabilityStatus;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private userService: UserService,
    public translate: TranslateService
  ) {}

  ngOnInit(): void {
    // Check if we're viewing a specific user's profile
    this.route.params.subscribe(params => {
      this.viewedUsername = params['username'];
      this.isViewingOtherProfile = !!this.viewedUsername;
      this.loadUserProfile();
    });
  }

  loadUserProfile(): void {
    this.isLoading = true;
    
    if (this.isViewingOtherProfile && this.viewedUsername) {
      // Load the talent's profile by username
      this.userService.getUserProfileByUsername(this.viewedUsername).subscribe({
        next: (profile) => {
          this.currentUser = profile;
          this.initializeForms();
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading talent profile:', error);
          this.router.navigate(['/talent-discovery']);
          this.isLoading = false;
        }
      });
    } else {
      // Load current user's profile (your own profile)
      this.userService.getCurrentUserProfile().subscribe({
        next: (profile) => {
          this.currentUser = profile;
          this.initializeForms();
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading user profile:', error);
          // Handle error - maybe redirect to login
          this.router.navigate(['/auth/login']);
          this.isLoading = false;
        }
      });
    }
  }

  initializeForms(): void {
    if (!this.currentUser) return;
    
    this.profileForm = this.fb.group({
      bio: [this.currentUser?.bio || '', [Validators.maxLength(500)]],
      location: [this.currentUser?.location || ''],
      hourlyRate: [this.currentUser?.hourlyRate || 0, [Validators.min(0)]],
      availability: [this.currentUser?.availability || AvailabilityStatus.AVAILABLE]
    });

this.portfolioForm = this.fb.group({
  title: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
  description: ['', [Validators.required, Validators.minLength(20), Validators.maxLength(1000)]],
  projectUrl: ['', [Validators.pattern(/^https?:\/\/.*$/)]],
  coverImage: [''],
  projectType: [ProjectType.WEB_APPLICATION], // Set default value
  technologies: ['', [Validators.maxLength(100)]]
});

    this.educationForm = this.fb.group({
      degree: ['', [Validators.required, Validators.minLength(3)]],
      institution: ['', [Validators.required, Validators.minLength(3)]],
      startYear: ['', [Validators.required, Validators.min(1950), Validators.max(new Date().getFullYear())]],
      endYear: ['', [Validators.min(1950), Validators.max(new Date().getFullYear() + 10)]],
      description: ['', [Validators.maxLength(500)]],
      gpa: ['', [Validators.pattern(/^\d{1,2}(\.\d{1,2})?$/)]]
    });

    this.certificationForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      issuer: ['', [Validators.required, Validators.minLength(3)]],
      issueDate: ['', [Validators.required]],
      expiryDate: [''],
      credentialId: [''],
      credentialUrl: ['', [Validators.pattern(/^https?:\/\/.*$/)]]
    });

    this.languagesForm = this.fb.group({
      languages: [this.currentUser?.languages?.join(', ') || '', [Validators.required]]
    });

    this.socialLinksForm = this.fb.group({
      github: [this.currentUser?.githubUrl || '', [Validators.pattern(/^https?:\/\/(www\.)?github\.com\/.*$/)]],
      stackoverflow: [this.currentUser?.stackoverflowUrl || '', [Validators.pattern(/^https?:\/\/(www\.)?stackoverflow\.com\/.*$/)]],
      linkedin: [this.currentUser?.linkedinUrl || '', [Validators.pattern(/^https?:\/\/(www\.)?linkedin\.com\/.*$/)]],
      website: [this.currentUser?.personalWebsiteUrl || '', [Validators.pattern(/^https?:\/\/.*$/)]]
    });

    this.workHistoryForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3)]],
      company: ['', [Validators.required, Validators.minLength(3)]],
      startDate: ['', [Validators.required]],
      endDate: [''],
      isCurrent: [false],
      description: ['', [Validators.maxLength(1000)]]
    });

    this.skillsForm = this.fb.group({
      searchQuery: ['']
    });
  }

  switchTab(tab: string): void {
    this.activeTab = tab;
  }

  toggleEditMode(): void {
    this.isEditMode = !this.isEditMode;
    if (!this.isEditMode) {
      this.initializeForms();
    }
  }

  saveProfile(): void {
    if (this.profileForm.valid) {
      this.isLoading = true;
      
      const formValue = this.profileForm.value;
      
      const updateRequest: ProfileUpdateRequest = {
        bio: formValue.bio,
        location: formValue.location,
        hourlyRate: formValue.hourlyRate,
        availability: formValue.availability
      };

      this.userService.updateProfile(updateRequest).subscribe({
        next: (updatedProfile) => {
          this.currentUser = updatedProfile;
          this.isLoading = false;
          this.isEditMode = false;
          alert('Profile updated successfully!');
        },
        error: (error) => {
          console.error('Error updating profile:', error);
          this.isLoading = false;
          alert('Error updating profile. Please try again.');
        }
      });
    }
  }

  toggleLanguage(): void {
    const newLang = this.translate.currentLang === 'en' ? 'fr' : 'en';
    this.translate.use(newLang);
  }

  // Portfolio Management Methods
  openPortfolioModal(portfolioItem?: PortfolioDto): void {
  this.showPortfolioModal = true;
  this.isEditingPortfolio = !!portfolioItem;
  this.editingPortfolioId = portfolioItem?.id || null;

  if (portfolioItem) {
    this.portfolioForm.patchValue({
      title: portfolioItem.title,
      description: portfolioItem.description,
      projectUrl: portfolioItem.projectLink || '',
      coverImage: '',
      projectType: portfolioItem.projectType || ProjectType.WEB_APPLICATION,
      technologies: portfolioItem.technologies || ''
    });
    
    // ✅ Set preview for existing image using the proper backend URL
    if (portfolioItem.coverImageUrl) {
      this.portfolioImagePreview = this.getImageUrl(portfolioItem.coverImageUrl);
    }
  } else {
   this.portfolioForm.reset();
    this.portfolioForm.patchValue({
      projectType: ProjectType.WEB_APPLICATION
    });
    this.selectedPortfolioImage = null;
    this.portfolioImagePreview = null;
  }
}

closePortfolioModal(): void {
  this.showPortfolioModal = false;
  this.isEditingPortfolio = false;
  this.editingPortfolioId = null;
  this.portfolioForm.reset();
  this.selectedPortfolioImage = null;
  this.portfolioImagePreview = null;
}

  // Portfolio image upload methods
  triggerPortfolioImageUpload(): void {
    const fileInput = document.getElementById('portfolioImageInput') as HTMLInputElement;
    if (fileInput) {
      fileInput.click();
    }
  }

 onPortfolioImageSelected(event: any): void {
  const file = event.target.files[0];
  if (file && file.type.startsWith('image/')) {
    this.selectedPortfolioImage = file;
    
    // Create preview
    const reader = new FileReader();
    reader.onload = (e: any) => {
      this.portfolioImagePreview = e.target.result;
    };
    reader.readAsDataURL(file);
  } else {
    alert('Please select a valid image file (jpg, jpeg, png, gif, or webp).');
  }
}

 removePortfolioImage(): void {
  this.selectedPortfolioImage = null;
  this.portfolioImagePreview = null;
  // Reset the file input
  const fileInput = document.querySelector('#portfolioImageInput') as HTMLInputElement;
  if (fileInput) {
    fileInput.value = '';
  }
}

savePortfolioItem(): void {
  if (!this.currentUser) return;
  
  if (this.portfolioForm.valid) {
    this.isLoading = true;
    const formValue = this.portfolioForm.value;

    // ✅ Handle real file upload instead of placeholder
    if (this.selectedPortfolioImage) {
      // Upload the image first
      this.userService.uploadPortfolioImage(this.selectedPortfolioImage).subscribe({
        next: (uploadResponse) => {
          // Now save the portfolio with the real image path
          this.savePortfolioWithImagePath(formValue, uploadResponse.imagePath);
        },
        error: (error) => {
          console.error('Error uploading image:', error);
          this.isLoading = false;
          alert('Error uploading image. Please try again.');
        }
      });
    } else {
      // No new image selected
      let existingImagePath = '';
      if (this.isEditingPortfolio && this.editingPortfolioId) {
        const existingItem = this.currentUser.portfolios.find(item => item.id === this.editingPortfolioId);
        existingImagePath = existingItem?.coverImageUrl || '';
      }
      this.savePortfolioWithImagePath(formValue, existingImagePath);
    }
  }
}

// ✅ Add this new helper method
private savePortfolioWithImagePath(formValue: any, imagePath: string): void {
  const portfolioRequest: PortfolioRequest = {
    title: formValue.title,
    description: formValue.description,
    projectLink: formValue.projectUrl || undefined,
    coverImageUrl: imagePath || undefined,
    projectType: formValue.projectType as ProjectType,
    technologies: formValue.technologies || undefined
  };

  if (this.isEditingPortfolio && this.editingPortfolioId) {
    this.userService.updatePortfolio(this.editingPortfolioId, portfolioRequest).subscribe({
      next: (updatedPortfolio) => {
        const index = this.currentUser!.portfolios.findIndex(item => item.id === this.editingPortfolioId);
        if (index !== -1) {
          this.currentUser!.portfolios[index] = updatedPortfolio;
        }
        this.isLoading = false;
        this.closePortfolioModal();
        alert('Portfolio item updated successfully!');
      },
      error: (error) => {
        console.error('Error updating portfolio:', error);
        this.isLoading = false;
        alert('Error updating portfolio. Please try again.');
      }
    });
  } else {
    this.userService.addPortfolio(portfolioRequest).subscribe({
      next: (newPortfolio) => {
        this.currentUser!.portfolios.unshift(newPortfolio);
        this.isLoading = false;
        this.closePortfolioModal();
        alert('Portfolio item added successfully!');
      },
      error: (error) => {
        console.error('Error adding portfolio:', error);
        this.isLoading = false;
        alert('Error adding portfolio. Please try again.');
      }
    });
  }
}

 deletePortfolioItem(portfolioId: number): void {
  if (!this.currentUser) return;
  
  if (confirm('Are you sure you want to delete this portfolio item?')) {
    this.userService.deletePortfolio(portfolioId).subscribe({
      next: () => {
        this.currentUser!.portfolios = this.currentUser!.portfolios.filter(item => item.id !== portfolioId);
        alert('Portfolio item deleted successfully!');
      },
      error: (error) => {
        console.error('Error deleting portfolio:', error);
        alert('Error deleting portfolio. Please try again.');
      }
    });
  }
}

  togglePortfolioVisibility(portfolioId: number): void {
    // Portfolio visibility is handled at the API level
    // For now, we just show a message
    alert('Portfolio visibility updated!');
  }

  addPortfolioItem(): void {
    this.openPortfolioModal();
  }

  getPortfolioErrorMessage(fieldName: string): string {
    const control = this.portfolioForm.get(fieldName);
    
    // Get field display name
    const fieldDisplayNames: { [key: string]: string } = {
      'title': 'Title',
      'description': 'Description',
      'projectUrl': 'Project URL'
    };
    
    const displayName = fieldDisplayNames[fieldName] || fieldName;
    
    if (control?.hasError('required')) {
      return `${displayName} is required`;
    }
    if (control?.hasError('minlength')) {
      const minLength = control.errors?.['minlength']?.requiredLength;
      return `${displayName} must be at least ${minLength} characters`;
    }
    if (control?.hasError('maxlength')) {
      const maxLength = control.errors?.['maxlength']?.requiredLength;
      return `${displayName} cannot exceed ${maxLength} characters`;
    }
    if (control?.hasError('pattern')) {
      if (fieldName === 'projectUrl') {
        return 'Please enter a valid URL (starting with http:// or https://)';
      }
    }
    return '';
  }

  isPortfolioFieldInvalid(fieldName: string): boolean {
    const field = this.portfolioForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  // ✅ Add helper method to get the correct image URL
  getImageUrl(imagePath: string): string {
    if (!imagePath) return '';
    
    // If it's already a full URL, return as is
    if (imagePath.startsWith('http')) {
      return imagePath;
    }
    
    // Extract filename from path
    const fileName = imagePath.substring(imagePath.lastIndexOf('/') + 1);
    return `http://localhost:8081/api/portfolios/image/${fileName}`;
  }

  // ✅ Add helper method for getting image filename
  getImageFileName(imagePath: string): string {
    if (!imagePath) return '';
    return imagePath.substring(imagePath.lastIndexOf('/') + 1);
  }

  // ✅ Add helper method to convert technologies string to array
  getTechnologiesArray(technologies: string): string[] {
    if (!technologies) return [];
    return technologies.split(',').map(tech => tech.trim()).filter(tech => tech.length > 0);
  }

  // ✅ Add helper method to get project type label
  getProjectTypeLabel(projectType: string): string {
    const typeLabels: { [key: string]: string } = {
      'WEB_APPLICATION': 'Web App',
      'MOBILE_APPLICATION': 'Mobile App',
      'DESKTOP_APPLICATION': 'Desktop App',
      'API_SERVICE': 'API Service',
      'OTHER': 'Other'
    };
    return typeLabels[projectType] || projectType;
  }

  // ✅ Add error handling for images
  onImageError(event: any): void {
    // Hide the image if it fails to load
    event.target.style.display = 'none';
    // Or you could set a placeholder image:
    // event.target.src = '/assets/images/portfolio-placeholder.png';
  }

  // Profile Picture Upload Methods
  triggerProfilePictureUpload(): void {
    const fileInput = document.getElementById('profilePictureInput') as HTMLInputElement;
    if (fileInput) {
      fileInput.click();
    }
  }

  onProfilePictureSelected(event: any): void {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB');
        return;
      }

      this.selectedProfilePicture = file;
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.profilePicturePreview = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  uploadProfilePicture(): void {
    if (!this.selectedProfilePicture) return;

    this.isUploadingProfilePicture = true;
    
    this.userService.uploadProfilePicture(this.selectedProfilePicture).subscribe({
      next: (response) => {
        // Update the current user's profile picture URL
        if (this.currentUser) {
          this.currentUser.profilePictureUrl = this.userService.getProfilePictureUrl(response.imagePath);
        }
        
        this.isUploadingProfilePicture = false;
        this.selectedProfilePicture = null;
        this.profilePicturePreview = null;
        
        // Reset file input
        const fileInput = document.getElementById('profilePictureInput') as HTMLInputElement;
        if (fileInput) {
          fileInput.value = '';
        }
        
        alert('Profile picture updated successfully!');
      },
      error: (error) => {
        console.error('Error uploading profile picture:', error);
        this.isUploadingProfilePicture = false;
        alert('Error uploading profile picture. Please try again.');
      }
    });
  }

  cancelProfilePictureUpload(): void {
    this.selectedProfilePicture = null;
    this.profilePicturePreview = null;
    
    // Reset file input
    const fileInput = document.getElementById('profilePictureInput') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }

  getProfilePictureUrl(imagePath: string): string {
    return this.userService.getProfilePictureUrl(imagePath);
  }

  // Education form error methods
  getEducationErrorMessage(fieldName: string): string {
    const control = this.educationForm.get(fieldName);
    
    const fieldDisplayNames: { [key: string]: string } = {
      'degree': 'Degree',
      'institution': 'Institution',
      'startYear': 'Start Year',
      'endYear': 'End Year',
      'description': 'Description',
      'gpa': 'GPA'
    };
    
    const displayName = fieldDisplayNames[fieldName] || fieldName;
    
    if (control?.hasError('required')) {
      return `${displayName} is required`;
    }
    if (control?.hasError('minlength')) {
      const minLength = control.errors?.['minlength']?.requiredLength;
      return `${displayName} must be at least ${minLength} characters`;
    }
    if (control?.hasError('maxlength')) {
      const maxLength = control.errors?.['maxlength']?.requiredLength;
      return `${displayName} cannot exceed ${maxLength} characters`;
    }
    if (control?.hasError('min')) {
      const min = control.errors?.['min']?.min;
      return `${displayName} must be at least ${min}`;
    }
    if (control?.hasError('max')) {
      const max = control.errors?.['max']?.max;
      return `${displayName} cannot exceed ${max}`;
    }
    if (control?.hasError('pattern')) {
      if (fieldName === 'gpa') {
        return 'Please enter a valid GPA (e.g., 3.8)';
      }
    }
    return '';
  }

  isEducationFieldInvalid(fieldName: string): boolean {
    const field = this.educationForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  // Certification form error methods
  getCertificationErrorMessage(fieldName: string): string {
    const control = this.certificationForm.get(fieldName);
    
    const fieldDisplayNames: { [key: string]: string } = {
      'name': 'Certification Name',
      'issuer': 'Issuer',
      'issueDate': 'Issue Date',
      'expiryDate': 'Expiry Date',
      'credentialId': 'Credential ID',
      'credentialUrl': 'Credential URL'
    };
    
    const displayName = fieldDisplayNames[fieldName] || fieldName;
    
    if (control?.hasError('required')) {
      return `${displayName} is required`;
    }
    if (control?.hasError('minlength')) {
      const minLength = control.errors?.['minlength']?.requiredLength;
      return `${displayName} must be at least ${minLength} characters`;
    }
    if (control?.hasError('pattern')) {
      if (fieldName === 'credentialUrl') {
        return 'Please enter a valid URL (starting with http:// or https://)';
      }
    }
    return '';
  }

  isCertificationFieldInvalid(fieldName: string): boolean {
    const field = this.certificationForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  // Languages form error methods
  getLanguagesErrorMessage(fieldName: string): string {
    const control = this.languagesForm.get(fieldName);
    
    if (control?.hasError('required')) {
      return 'At least one language is required';
    }
    return '';
  }

  isLanguagesFieldInvalid(fieldName: string): boolean {
    const field = this.languagesForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  // Social Links form error methods
  getSocialLinksErrorMessage(fieldName: string): string {
    const control = this.socialLinksForm.get(fieldName);
    
    const fieldDisplayNames: { [key: string]: string } = {
      'github': 'GitHub URL',
      'stackoverflow': 'Stack Overflow URL',
      'linkedin': 'LinkedIn URL',
      'website': 'Personal Website URL'
    };
    
    const displayName = fieldDisplayNames[fieldName] || fieldName;
    
    if (control?.hasError('pattern')) {
      if (fieldName === 'github') {
        return 'Please enter a valid GitHub URL (e.g., https://github.com/username)';
      }
      if (fieldName === 'stackoverflow') {
        return 'Please enter a valid Stack Overflow URL';
      }
      if (fieldName === 'linkedin') {
        return 'Please enter a valid LinkedIn URL';
      }
      if (fieldName === 'website') {
        return 'Please enter a valid URL (starting with http:// or https://)';
      }
    }
    return '';
  }

  isSocialLinksFieldInvalid(fieldName: string): boolean {
    const field = this.socialLinksForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  // Work History form error methods
  getWorkHistoryErrorMessage(fieldName: string): string {
    const control = this.workHistoryForm.get(fieldName);
    
    const fieldDisplayNames: { [key: string]: string } = {
      'title': 'Job Title',
      'company': 'Company',
      'startDate': 'Start Date',
      'endDate': 'End Date',
      'description': 'Description'
    };
    
    const displayName = fieldDisplayNames[fieldName] || fieldName;
    
    if (control?.hasError('required')) {
      return `${displayName} is required`;
    }
    if (control?.hasError('minlength')) {
      const minLength = control.errors?.['minlength']?.requiredLength;
      return `${displayName} must be at least ${minLength} characters`;
    }
    if (control?.hasError('maxlength')) {
      const maxLength = control.errors?.['maxlength']?.requiredLength;
      return `${displayName} cannot exceed ${maxLength} characters`;
    }
    return '';
  }

  isWorkHistoryFieldInvalid(fieldName: string): boolean {
    const field = this.workHistoryForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  // Skills form error methods (simplified for skill selection)
  isSkillsFormValid(): boolean {
    return this.selectedSkills.length > 0;
  }

  getStarArray(rating: number): number[] {
    return Array(5).fill(0).map((_, i) => i < Math.floor(rating) ? 1 : 0);
  }

  formatDate(dateString: string): string {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    const lang = this.translate.currentLang === 'fr' ? 'fr-FR' : 'en-US';
    return new Intl.DateTimeFormat(lang, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  }

  getRelativeTime(dateString: string): string {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    // translate.instant() gets a translation synchronously
    if (diffDays === 0) return this.translate.instant('today');
    if (diffDays === 1) return this.translate.instant('yesterday');
    if (diffDays < 30) {
      // Here, we pass a parameter to the translation
      return this.translate.instant('daysAgo', { days: diffDays });
    }
    
    return this.formatDate(dateString);
  }

  getAvailabilityColor(availability: AvailabilityStatus): string {
    switch (availability) {
      case AvailabilityStatus.AVAILABLE: return 'text-green-600 bg-green-100';
      case AvailabilityStatus.BUSY: return 'text-yellow-600 bg-yellow-100';
      case AvailabilityStatus.UNAVAILABLE: return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  }

  hasSocialLinks(): boolean {
    return !!(
      this.currentUser?.githubUrl || 
      this.currentUser?.stackoverflowUrl || 
      this.currentUser?.linkedinUrl || 
      this.currentUser?.personalWebsiteUrl
    );
  }

  logout(): void {
    this.router.navigate(['/auth/login']);
  }

  contactTalent(): void {
    if (this.currentUser && this.isViewingOtherProfile) {
      alert(`Contact feature will be implemented. Contact ${this.currentUser.username}`);
    }
  }

  goBackToTalentDiscovery(): void {
    this.router.navigate(['/talent-discovery']);
  }

  addExperience(): void {
    this.openWorkHistoryModal();
  }

  openProject(url?: string): void {
    if (url) {
      window.open(url, '_blank');
    }
  }

  // Resume upload methods
  onResumeFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file && file.type === 'application/pdf') {
      this.selectedResumeFile = file;
      this.uploadResume();
    } else {
      alert('Please select a PDF file for your resume.');
    }
  }

  uploadResume(): void {
    if (this.selectedResumeFile) {
      this.isLoading = true;
      this.resumeUploadProgress = 0;
      
      // Simulate upload progress
      const interval = setInterval(() => {
        this.resumeUploadProgress += 10;
        if (this.resumeUploadProgress >= 100) {
          clearInterval(interval);
          
          // In a real app, you would upload the file to a server and get back the URL
          const resumeUpdateRequest: ResumeUpdateRequest = {
            fileName: this.selectedResumeFile!.name,
            resumeUrl: URL.createObjectURL(this.selectedResumeFile!)
          };
          
          this.userService.updateResume(resumeUpdateRequest).subscribe({
            next: (updatedProfile) => {
              this.currentUser = updatedProfile;
              this.selectedResumeFile = null;
              this.isLoading = false;
              this.resumeUploadProgress = 0;
              alert('Resume uploaded successfully!');
            },
            error: (error) => {
              console.error('Error uploading resume:', error);
              this.selectedResumeFile = null;
              this.isLoading = false;
              this.resumeUploadProgress = 0;
              alert('Error uploading resume. Please try again.');
            }
          });
        }
      }, 100);
    }
  }

  removeResume(): void {
    if (confirm('Are you sure you want to remove your resume?')) {
      this.userService.removeResume().subscribe({
        next: (updatedProfile) => {
          this.currentUser = updatedProfile;
          alert('Resume removed successfully!');
        },
        error: (error) => {
          console.error('Error removing resume:', error);
          alert('Error removing resume. Please try again.');
        }
      });
    }
  }

  downloadResume(): void {
    if (!this.currentUser) return;
    
    if (this.currentUser.resumeUrl) {
      const link = document.createElement('a');
      link.href = this.currentUser.resumeUrl;
      link.download = this.currentUser.resumeFileName || 'resume.pdf';
      link.click();
    }
  }

  // Education Modal Methods
  openEducationModal(education?: EducationDto): void {
    this.showEducationModal = true;
    this.isEditingEducation = !!education;
    this.editingEducationId = education?.id || null;

    if (education) {
      this.educationForm.patchValue({
        degree: education.degree,
        institution: education.institution,
        startYear: education.startYear,
        endYear: education.endYear || '',
        description: education.description || '',
        gpa: education.gpa || ''
      });
    } else {
      this.educationForm.reset();
    }
  }

  closeEducationModal(): void {
    this.showEducationModal = false;
    this.isEditingEducation = false;
    this.editingEducationId = null;
    this.educationForm.reset();
  }

  saveEducation(): void {
    if (!this.currentUser) return;
    
    if (this.educationForm.valid) {
      this.isLoading = true;
      const formValue = this.educationForm.value;

      const educationRequest: EducationRequest = {
        degree: formValue.degree,
        institution: formValue.institution,
        startYear: formValue.startYear,
        endYear: formValue.endYear || undefined,
        description: formValue.description,
        gpa: formValue.gpa
      };

      if (this.isEditingEducation && this.editingEducationId) {
        // Update existing education
        this.userService.updateEducation(this.editingEducationId, educationRequest).subscribe({
          next: (updatedEducation) => {
            const index = this.currentUser!.education.findIndex(edu => edu.id === this.editingEducationId);
            if (index !== -1) {
              this.currentUser!.education[index] = updatedEducation;
            }
            this.isLoading = false;
            this.closeEducationModal();
            alert('Education updated successfully!');
          },
          error: (error) => {
            console.error('Error updating education:', error);
            this.isLoading = false;
            alert('Error updating education. Please try again.');
          }
        });
      } else {
        // Add new education
        this.userService.addEducation(educationRequest).subscribe({
          next: (newEducation) => {
            this.currentUser!.education.unshift(newEducation);
            this.isLoading = false;
            this.closeEducationModal();
            alert('Education added successfully!');
          },
          error: (error) => {
            console.error('Error adding education:', error);
            this.isLoading = false;
            alert('Error adding education. Please try again.');
          }
        });
      }
    }
  }

  deleteEducation(educationId: number): void {
    if (!this.currentUser) return;
    
    if (confirm('Are you sure you want to delete this education record?')) {
      this.userService.deleteEducation(educationId).subscribe({
        next: () => {
          this.currentUser!.education = this.currentUser!.education.filter(edu => edu.id !== educationId);
          alert('Education deleted successfully!');
        },
        error: (error) => {
          console.error('Error deleting education:', error);
          alert('Error deleting education. Please try again.');
        }
      });
    }
  }

  // Certification Modal Methods
  openCertificationModal(certification?: CertificationDto): void {
    this.showCertificationModal = true;
    this.isEditingCertification = !!certification;
    this.editingCertificationId = certification?.id || null;

    if (certification) {
      this.certificationForm.patchValue({
        name: certification.name,
        issuer: certification.issuer,
        issueDate: certification.issueDate ? certification.issueDate.split('T')[0] : '', // Convert ISO string to date input format
        expiryDate: certification.expiryDate ? certification.expiryDate.split('T')[0] : '',
        credentialId: certification.credentialId || '',
        credentialUrl: certification.credentialUrl || ''
      });
    } else {
      this.certificationForm.reset();
    }
  }

  closeCertificationModal(): void {
    this.showCertificationModal = false;
    this.isEditingCertification = false;
    this.editingCertificationId = null;
    this.certificationForm.reset();
  }

  saveCertification(): void {
    if (!this.currentUser) return;
    
    if (this.certificationForm.valid) {
      this.isLoading = true;
      const formValue = this.certificationForm.value;

      const certificationRequest: CertificationRequest = {
        name: formValue.name,
        issuer: formValue.issuer,
        issueDate: formValue.issueDate,
        expiryDate: formValue.expiryDate || undefined,
        credentialId: formValue.credentialId,
        credentialUrl: formValue.credentialUrl
      };

      if (this.isEditingCertification && this.editingCertificationId) {
        // Update existing certification
        this.userService.updateCertification(this.editingCertificationId, certificationRequest).subscribe({
          next: (updatedCertification) => {
            const index = this.currentUser!.certifications.findIndex(cert => cert.id === this.editingCertificationId);
            if (index !== -1) {
              this.currentUser!.certifications[index] = updatedCertification;
            }
            this.isLoading = false;
            this.closeCertificationModal();
            alert('Certification updated successfully!');
          },
          error: (error) => {
            console.error('Error updating certification:', error);
            this.isLoading = false;
            alert('Error updating certification. Please try again.');
          }
        });
      } else {
        // Add new certification
        this.userService.addCertification(certificationRequest).subscribe({
          next: (newCertification) => {
            this.currentUser!.certifications.unshift(newCertification);
            this.isLoading = false;
            this.closeCertificationModal();
            alert('Certification added successfully!');
          },
          error: (error) => {
            console.error('Error adding certification:', error);
            this.isLoading = false;
            alert('Error adding certification. Please try again.');
          }
        });
      }
    }
  }

  deleteCertification(certificationId: number): void {
    if (!this.currentUser) return;
    
    if (confirm('Are you sure you want to delete this certification?')) {
      this.userService.deleteCertification(certificationId).subscribe({
        next: () => {
          this.currentUser!.certifications = this.currentUser!.certifications.filter(cert => cert.id !== certificationId);
          alert('Certification deleted successfully!');
        },
        error: (error) => {
          console.error('Error deleting certification:', error);
          alert('Error deleting certification. Please try again.');
        }
      });
    }
  }

  // Languages Modal Methods
  openLanguagesModal(): void {
    this.showLanguagesModal = true;
    this.languagesForm.patchValue({
      languages: this.currentUser?.languages?.join(', ') || ''
    });
  }

  closeLanguagesModal(): void {
    this.showLanguagesModal = false;
    this.languagesForm.reset();
  }

  saveLanguages(): void {
    if (!this.currentUser) return;
    
    if (this.languagesForm.valid) {
      this.isLoading = true;
      const formValue = this.languagesForm.value;
      
      const languagesString = formValue.languages;
      
      const updateRequest: ProfileUpdateRequest = {
        languages: languagesString
      };

      this.userService.updateProfile(updateRequest).subscribe({
        next: (updatedProfile) => {
          this.currentUser = updatedProfile;
          this.isLoading = false;
          this.closeLanguagesModal();
          alert('Languages updated successfully!');
        },
        error: (error) => {
          console.error('Error updating languages:', error);
          this.isLoading = false;
          alert('Error updating languages. Please try again.');
        }
      });
    }
  }

  // Social Links Modal Methods
  openSocialLinksModal(): void {
    this.showSocialLinksModal = true;
    this.socialLinksForm.patchValue({
      github: this.currentUser?.githubUrl || '',
      stackoverflow: this.currentUser?.stackoverflowUrl || '',
      linkedin: this.currentUser?.linkedinUrl || '',
      website: this.currentUser?.personalWebsiteUrl || ''
    });
  }

  closeSocialLinksModal(): void {
    this.showSocialLinksModal = false;
    this.socialLinksForm.reset();
  }

  saveSocialLinks(): void {
    if (this.socialLinksForm.valid) {
      this.isLoading = true;
      const formValue = this.socialLinksForm.value;
      
      const updateRequest: ProfileUpdateRequest = {
        githubUrl: formValue.github || undefined,
        stackoverflowUrl: formValue.stackoverflow || undefined,
        linkedinUrl: formValue.linkedin || undefined,
        personalWebsiteUrl: formValue.website || undefined
      };

      this.userService.updateProfile(updateRequest).subscribe({
        next: (updatedProfile) => {
          this.currentUser = updatedProfile;
          this.isLoading = false;
          this.closeSocialLinksModal();
          alert('Social links updated successfully!');
        },
        error: (error) => {
          console.error('Error updating social links:', error);
          this.isLoading = false;
          alert('Error updating social links. Please try again.');
        }
      });
    }
  }

  // Work History Modal Methods
  openWorkHistoryModal(workItem?: ExperienceDto): void {
    this.showWorkHistoryModal = true;
    this.editingWorkHistory = workItem || null;

    if (workItem) {
      this.workHistoryForm.patchValue({
        title: workItem.title,
        company: workItem.company,
        startDate: workItem.startDate,
        endDate: workItem.endDate || '',
        isCurrent: workItem.isCurrent || false,
        description: workItem.description || ''
      });
    } else {
      this.workHistoryForm.reset();
    }
  }

  closeWorkHistoryModal(): void {
    this.showWorkHistoryModal = false;
    this.editingWorkHistory = null;
    this.workHistoryForm.reset();
  }

  saveWorkHistory(): void {
    if (!this.currentUser) return;
    
    if (this.workHistoryForm.valid) {
      this.isLoading = true;
      const formValue = this.workHistoryForm.value;

      const experienceRequest: ExperienceRequest = {
        title: formValue.title,
        company: formValue.company,
        startDate: formValue.startDate,
        endDate: formValue.endDate || undefined,
        isCurrent: formValue.isCurrent,
        description: formValue.description
      };

      if (this.editingWorkHistory) {
        // Update existing work history
        this.userService.updateExperience(this.editingWorkHistory.id, experienceRequest).subscribe({
          next: (updatedExperience) => {
            const index = this.currentUser!.experience.findIndex(exp => exp.id === this.editingWorkHistory!.id);
            if (index !== -1) {
              this.currentUser!.experience[index] = updatedExperience;
            }
            this.isLoading = false;
            this.closeWorkHistoryModal();
            alert('Work history updated successfully!');
          },
          error: (error) => {
            console.error('Error updating work history:', error);
            this.isLoading = false;
            alert('Error updating work history. Please try again.');
          }
        });
      } else {
        // Add new work history
        this.userService.addExperience(experienceRequest).subscribe({
          next: (newExperience) => {
            this.currentUser!.experience.unshift(newExperience);
            this.isLoading = false;
            this.closeWorkHistoryModal();
            alert('Work history added successfully!');
          },
          error: (error) => {
            console.error('Error adding work history:', error);
            this.isLoading = false;
            alert('Error adding work history. Please try again.');
          }
        });
      }
    }
  }

  deleteExperience(experienceId: number): void {
    if (!this.currentUser) return;
    
    if (confirm('Are you sure you want to delete this work experience?')) {
      this.userService.deleteExperience(experienceId).subscribe({
        next: () => {
          this.currentUser!.experience = this.currentUser!.experience.filter(exp => exp.id !== experienceId);
          alert('Work experience deleted successfully!');
        },
        error: (error) => {
          console.error('Error deleting work experience:', error);
          alert('Error deleting work experience. Please try again.');
        }
      });
    }
  }

  // Skills Modal Methods
  openSkillsModal(): void {
    this.showSkillsModal = true;
    this.loadAvailableSkills();
    this.loadSelectedSkills();
  }

  closeSkillsModal(): void {
    this.showSkillsModal = false;
    this.skillsForm.reset();
    this.searchSkillQuery = '';
    this.filteredSkills = [];
  }

  loadAvailableSkills(): void {
    this.userService.getAllSkills().subscribe({
      next: (skills) => {
        this.availableSkills = skills;
        this.filteredSkills = [...skills];
      },
      error: (error) => {
        console.error('Error loading skills:', error);
      }
    });

    this.userService.getSkillCategories().subscribe({
      next: (categories) => {
        this.skillCategories = categories;
      },
      error: (error) => {
        console.error('Error loading skill categories:', error);
      }
    });
  }

  loadSelectedSkills(): void {
    this.selectedSkills = [...(this.currentUser?.skills || [])];
  }

  filterSkills(): void {
    if (!this.searchSkillQuery.trim()) {
      this.filteredSkills = [...this.availableSkills];
    } else {
      this.filteredSkills = this.availableSkills.filter(skill =>
        skill.name.toLowerCase().includes(this.searchSkillQuery.toLowerCase()) ||
        skill.category.toLowerCase().includes(this.searchSkillQuery.toLowerCase())
      );
    }
  }

  filterSkillsByCategory(category: string): void {
    if (category === 'all') {
      this.filteredSkills = [...this.availableSkills];
    } else {
      this.filteredSkills = this.availableSkills.filter(skill => skill.category === category);
    }
    this.searchSkillQuery = '';
  }

  isSkillSelected(skill: SkillDto): boolean {
    return this.selectedSkills.some(selected => selected.id === skill.id);
  }

  toggleSkill(skill: SkillDto): void {
    const isSelected = this.isSkillSelected(skill);
    
    if (isSelected) {
      this.selectedSkills = this.selectedSkills.filter(selected => selected.id !== skill.id);
    } else {
      this.selectedSkills.push(skill);
    }
  }

  removeSkill(skillId: number): void {
    this.selectedSkills = this.selectedSkills.filter(skill => skill.id !== skillId);
  }

  saveSkills(): void {
    this.isLoading = true;
    
    // Get current user skills to determine which to add and remove
    const currentSkillIds = this.currentUser?.skills?.map(skill => skill.id) || [];
    const selectedSkillIds = this.selectedSkills.map(skill => skill.id);
    
    // Skills to add
    const skillsToAdd = selectedSkillIds.filter(id => !currentSkillIds.includes(id));
    
    // Skills to remove
    const skillsToRemove = currentSkillIds.filter(id => !selectedSkillIds.includes(id));
    
    // Process all skill changes
    const addPromises = skillsToAdd.map(skillId => 
      this.userService.addSkillToCurrentUser(skillId).toPromise()
    );
    
    const removePromises = skillsToRemove.map(skillId => 
      this.userService.removeSkillFromCurrentUser(skillId).toPromise()
    );
    
    Promise.all([...addPromises, ...removePromises])
      .then(() => {
        // Update the current user skills
        if (this.currentUser) {
          this.currentUser.skills = [...this.selectedSkills];
        }
        
        this.isLoading = false;
        this.closeSkillsModal();
        alert('Skills updated successfully!');
      })
      .catch((error) => {
        console.error('Error updating skills:', error);
        this.isLoading = false;
        alert('Error updating skills. Please try again.');
      });
  }

  // Public View Toggle
  togglePublicView(): void {
    this.isPublicView = !this.isPublicView;
  }
}