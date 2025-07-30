import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

export interface UserProfile {
  id: string;
  username: string;
  role: 'service_company' | 'freelancer' | 'client';
  isVerified: boolean;
  avatar?: string;
  bio?: string;
  skills: string[];
  experience: ExperienceItem[];
  portfolio: PortfolioItem[];
  rating: number;
  totalReviews: number;
  reviews: Review[];
  languages: string[];
  location?: string;
  hourlyRate?: number;
  availability: 'available' | 'busy' | 'unavailable';
  joinedDate: Date;
  lastActive: Date;
  // Service Company specific
  companyName?: string;
  companySize?: string;
  teamMembers?: TeamMember[];
  // Client specific
  industry?: string;
  projectsPosted?: number;
}

export interface ExperienceItem {
  id: string;
  title: string;
  company: string;
  startDate: Date;
  endDate?: Date;
  isCurrent: boolean;
  description: string;
}

// Updated Portfolio Interface
export interface PortfolioItem {
  id: string;
  title: string;
  description: string;
  projectUrl?: string;
  coverImage?: string;
  createdDate: Date;
  isPublic: boolean;
}

export interface Review {
  id: string;
  reviewerName: string;
  reviewerAvatar?: string;
  rating: number;
  comment: string;
  projectTitle: string;
  date: Date;
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  avatar?: string;
  skills: string[];
}

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TranslateModule
  ],
  templateUrl: './profile.html',
  styleUrl: './profile.scss'
})
export class Profile implements OnInit {
  currentUser!: UserProfile;
  isEditMode = false;
  activeTab = 'overview';
  profileForm!: FormGroup;
  portfolioForm!: FormGroup;
  isLoading = false;
  currentLanguage = 'en';
  
  // Portfolio management
  showPortfolioModal = false;
  isEditingPortfolio = false;
  editingPortfolioId: string | null = null;

  // Mock data - replace with actual API call
  mockUser: UserProfile = {
    id: '1',
    username: 'developer_pro',
    role: 'freelancer',
    isVerified: true,
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
    bio: 'Full-stack developer with 8+ years of experience in web and mobile applications. Passionate about creating scalable solutions and mentoring junior developers.',
    skills: ['React', 'Node.js', 'TypeScript', 'Python', 'AWS', 'MongoDB', 'PostgreSQL', 'Docker'],
    experience: [
      {
        id: '1',
        title: 'Senior Full Stack Developer',
        company: 'Tech Solutions Inc',
        startDate: new Date('2021-01-01'),
        endDate: new Date('2024-12-01'),
        isCurrent: false,
        description: 'Led development of microservices architecture, mentored 3 junior developers, and improved system performance by 40%.'
      },
      {
        id: '2',
        title: 'Frontend Developer',
        company: 'Digital Agency',
        startDate: new Date('2018-06-01'),
        endDate: new Date('2020-12-01'),
        isCurrent: false,
        description: 'Developed responsive web applications using React and Vue.js, collaborated with design teams.'
      }
    ],
    portfolio: [
      {
        id: '1',
        title: 'E-commerce Platform',
        description: 'Modern e-commerce solution with real-time inventory management, payment processing, and advanced analytics dashboard. Built with modern technologies and best practices.',
        coverImage: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=600&h=400&fit=crop',
        projectUrl: 'https://example-ecommerce.com',
        createdDate: new Date('2024-08-15'),
        isPublic: true
      },
      {
        id: '2',
        title: 'Task Management App',
        description: 'Collaborative task management application with real-time updates, team collaboration features, and project tracking capabilities.',
        coverImage: 'https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=600&h=400&fit=crop',
        projectUrl: 'https://example-tasks.com',
        createdDate: new Date('2024-06-20'),
        isPublic: true
      },
      {
        id: '3',
        title: 'AI-Powered Analytics Dashboard',
        description: 'Advanced analytics dashboard with machine learning insights, data visualization, and predictive analytics for business intelligence.',
        coverImage: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&h=400&fit=crop',
        projectUrl: 'https://example-analytics.com',
        createdDate: new Date('2024-04-10'),
        isPublic: true
      }
    ],
    rating: 4.8,
    totalReviews: 47,
    reviews: [
      {
        id: '1',
        reviewerName: 'Sarah Johnson',
        reviewerAvatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b586?w=50&h=50&fit=crop&crop=face',
        rating: 5,
        comment: 'Outstanding work! Delivered the project ahead of schedule with excellent code quality. Highly recommended!',
        projectTitle: 'E-commerce Platform',
        date: new Date('2024-09-15')
      },
      {
        id: '2',
        reviewerName: 'Michael Chen',
        reviewerAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=50&h=50&fit=crop&crop=face',
        rating: 5,
        comment: 'Great communication and technical expertise. The solution exceeded our expectations.',
        projectTitle: 'Task Management App',
        date: new Date('2024-08-22')
      },
      {
        id: '3',
        reviewerName: 'Emma Wilson',
        rating: 4,
        comment: 'Solid work and good problem-solving skills. Minor delays but overall satisfied with the outcome.',
        projectTitle: 'Mobile App Development',
        date: new Date('2024-07-10')
      }
    ],
    languages: ['English', 'French', 'Spanish'],
    location: 'Remote',
    hourlyRate: 85,
    availability: 'available',
    joinedDate: new Date('2020-03-15'),
    lastActive: new Date('2024-12-20T10:30:00')
  };

 

  constructor(
    private fb: FormBuilder,
    private router: Router,
   public translate: TranslateService // Inject the service. 'public' makes it accessible in the template.

  ) {}

  ngOnInit(): void {
    this.loadUserProfile();
    this.initializeForms();
  }

  loadUserProfile(): void {
    this.currentUser = this.mockUser;
  }

  initializeForms(): void {
    this.profileForm = this.fb.group({
      bio: [this.currentUser?.bio || '', [Validators.maxLength(500)]],
      location: [this.currentUser?.location || ''],
      hourlyRate: [this.currentUser?.hourlyRate || 0, [Validators.min(0)]],
      availability: [this.currentUser?.availability || 'available'],
      skills: [this.currentUser?.skills?.join(', ') || '']
    });

    this.portfolioForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
      description: ['', [Validators.required, Validators.minLength(20), Validators.maxLength(1000)]],
      projectUrl: ['', [Validators.pattern(/^https?:\/\/.*$/)]],
      coverImage: ['', [Validators.pattern(/^https?:\/\/.*\.(jpg|jpeg|png|gif|webp)$/i)]],
      isPublic: [true]
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
      this.currentUser.bio = formValue.bio;
      this.currentUser.location = formValue.location;
      this.currentUser.hourlyRate = formValue.hourlyRate;
      this.currentUser.availability = formValue.availability;
      this.currentUser.skills = formValue.skills.split(',').map((skill: string) => skill.trim()).filter((skill: string) => skill);

      setTimeout(() => {
        this.isLoading = false;
        this.isEditMode = false;
        alert('Profile updated successfully!');
      }, 1000);
    }
  }

toggleLanguage(): void {
    const newLang = this.translate.currentLang === 'en' ? 'fr' : 'en';
    this.translate.use(newLang);
  }



  // Portfolio Management Methods
  openPortfolioModal(portfolioItem?: PortfolioItem): void {
    this.showPortfolioModal = true;
    this.isEditingPortfolio = !!portfolioItem;
    this.editingPortfolioId = portfolioItem?.id || null;

    if (portfolioItem) {
      this.portfolioForm.patchValue({
        title: portfolioItem.title,
        description: portfolioItem.description,
        projectUrl: portfolioItem.projectUrl || '',
        coverImage: portfolioItem.coverImage || '',
        isPublic: portfolioItem.isPublic
      });
    } else {
      this.portfolioForm.reset({ isPublic: true });
    }
  }

  closePortfolioModal(): void {
    this.showPortfolioModal = false;
    this.isEditingPortfolio = false;
    this.editingPortfolioId = null;
    this.portfolioForm.reset({ isPublic: true });
  }

  savePortfolioItem(): void {
    if (this.portfolioForm.valid) {
      this.isLoading = true;
      const formValue = this.portfolioForm.value;

      if (this.isEditingPortfolio && this.editingPortfolioId) {
        // Update existing portfolio item
        const index = this.currentUser.portfolio.findIndex(item => item.id === this.editingPortfolioId);
        if (index !== -1) {
          this.currentUser.portfolio[index] = {
            ...this.currentUser.portfolio[index],
            title: formValue.title,
            description: formValue.description,
            projectUrl: formValue.projectUrl,
            coverImage: formValue.coverImage,
            isPublic: formValue.isPublic
          };
        }
      } else {
        // Add new portfolio item
        const newPortfolioItem: PortfolioItem = {
          id: Date.now().toString(),
          title: formValue.title,
          description: formValue.description,
          projectUrl: formValue.projectUrl,
          coverImage: formValue.coverImage,
          createdDate: new Date(),
          isPublic: formValue.isPublic
        };
        this.currentUser.portfolio.unshift(newPortfolioItem);
      }

      setTimeout(() => {
        this.isLoading = false;
        this.closePortfolioModal();
        alert(this.isEditingPortfolio ? 'Portfolio item updated successfully!' : 'Portfolio item added successfully!');
      }, 1000);
    }
  }

  deletePortfolioItem(portfolioId: string): void {
    if (confirm(this.translate.instant('confirmDelete'))) {
      this.currentUser.portfolio = this.currentUser.portfolio.filter(item => item.id !== portfolioId);
      alert('Portfolio item deleted successfully!');
    }
  }

  togglePortfolioVisibility(portfolioId: string): void {
    const item = this.currentUser.portfolio.find(item => item.id === portfolioId);
    if (item) {
      item.isPublic = !item.isPublic;
      alert(`Portfolio item is now ${item.isPublic ? 'public' : 'private'}!`);
    }
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
    'projectUrl': 'Project URL',
    'coverImage': 'Cover Image'
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
    if (fieldName === 'coverImage') {
      return 'Please enter a valid image URL (jpg, jpeg, png, gif, or webp)';
    }
  }
  return '';
}
  isPortfolioFieldInvalid(fieldName: string): boolean {
    const field = this.portfolioForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getStarArray(rating: number): number[] {
    return Array(5).fill(0).map((_, i) => i < Math.floor(rating) ? 1 : 0);
  }

 formatDate(date: Date): string {
    const lang = this.translate.currentLang === 'fr' ? 'fr-FR' : 'en-US';
    return new Intl.DateTimeFormat(lang, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  }

  getRelativeTime(date: Date): string {
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
    
    return this.formatDate(date);
  }

  getAvailabilityColor(availability: string): string {
    switch (availability) {
      case 'available': return 'text-green-600 bg-green-100';
      case 'busy': return 'text-yellow-600 bg-yellow-100';
      case 'unavailable': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  }

  logout(): void {
    this.router.navigate(['/auth/login']);
  }

  addExperience(): void {
    alert('Add experience functionality will be implemented');
  }

  openProject(url?: string): void {
    if (url) {
      window.open(url, '_blank');
    }
  }
}