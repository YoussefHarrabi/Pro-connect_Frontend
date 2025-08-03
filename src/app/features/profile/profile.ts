import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { SharedNavbar, NavbarConfig } from '../../shared/components/shared-navbar/shared-navbar';
import { SharedFooter } from '../../shared/components/shared-footer/shared-footer';

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
  education?: EducationItem[];
  certifications?: CertificationItem[];
  socialLinks?: SocialLinks;
  rating: number;
  totalReviews: number;
  reviews: Review[];
  languages: string[];
  location?: string;
  hourlyRate?: number;
  availability: 'available' | 'busy' | 'unavailable';
  joinedDate: Date;
  lastActive: Date;
  // Resume properties
  resumeUrl?: string;
  resumeFileName?: string;
  resumeUploadedDate?: Date;
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

export interface EducationItem {
  id: string;
  degree: string;
  institution: string;
  startYear: number;
  endYear?: number;
  description?: string;
  gpa?: string;
}

export interface CertificationItem {
  id: string;
  name: string;
  issuer: string;
  issueDate: Date;
  expiryDate?: Date;
  credentialId?: string;
  credentialUrl?: string;
}

export interface SocialLinks {
  github?: string;
  stackoverflow?: string;
  linkedin?: string;
  website?: string;
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
    TranslateModule,
    SharedNavbar,
    SharedFooter
  ],
  templateUrl: './profile.html',
  styleUrl: './profile.scss'
})
export class Profile implements OnInit {
  currentUser!: UserProfile;
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
  isLoading = false;
  currentLanguage = 'en';
  
  // Profile viewing properties
  isViewingOtherProfile = false;
  viewedUsername: string | null = null;
  
  // Resume upload
  selectedResumeFile: File | null = null;
  resumeUploadProgress = 0;
  
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
  
  isEditingPortfolio = false;
  isEditingEducation = false;
  isEditingCertification = false;
  editingPortfolioId: string | null = null;
  editingEducationId: string | null = null;
  editingCertificationId: string | null = null;
  editingPortfolioItem: any = null;
  editingWorkHistory: any = null;

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
    education: [
      {
        id: '1',
        degree: 'Bachelor of Science in Computer Science',
        institution: 'Stanford University',
        startYear: 2012,
        endYear: 2016,
        description: 'Focus on software engineering and algorithms',
        gpa: '3.8'
      },
      {
        id: '2',
        degree: 'Master of Science in Software Engineering',
        institution: 'MIT',
        startYear: 2016,
        endYear: 2018,
        description: 'Specialized in distributed systems and cloud computing'
      }
    ],
    certifications: [
      {
        id: '1',
        name: 'AWS Certified Solutions Architect',
        issuer: 'Amazon Web Services',
        issueDate: new Date('2023-01-15'),
        expiryDate: new Date('2026-01-15'),
        credentialId: 'AWS-SA-12345'
      },
      {
        id: '2',
        name: 'Google Cloud Professional Developer',
        issuer: 'Google Cloud',
        issueDate: new Date('2022-06-10'),
        expiryDate: new Date('2024-06-10'),
        credentialId: 'GCP-DEV-67890'
      }
    ],
    socialLinks: {
      github: 'https://github.com/developer_pro',
      stackoverflow: 'https://stackoverflow.com/users/123456/developer-pro',
      linkedin: 'https://linkedin.com/in/developer-pro',
      website: 'https://developer-pro.com'
    },
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

  // Mock talent profiles for demo purposes
  mockTalentProfiles: { [username: string]: UserProfile } = {
    'developer_pro': this.mockUser, // Reference to the current user
    'sarah_designer': {
      id: '2',
      username: 'sarah_designer',
      role: 'freelancer',
      isVerified: true,
      avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b586?w=150&h=150&fit=crop&crop=face',
      bio: 'Creative UI/UX designer with 6+ years of experience in creating beautiful and user-friendly interfaces. Specialized in mobile-first design and accessibility.',
      skills: ['UI/UX Design', 'Figma', 'Adobe Creative Suite', 'Prototyping', 'User Research', 'Accessibility'],
      experience: [
        {
          id: '1',
          title: 'Senior UI/UX Designer',
          company: 'Design Studio Co',
          startDate: new Date('2020-01-01'),
          endDate: new Date('2024-01-01'),
          isCurrent: false,
          description: 'Led design for multiple web and mobile applications, conducted user research, and mentored junior designers.'
        },
        {
          id: '2',
          title: 'Product Designer',
          company: 'Tech Startup',
          startDate: new Date('2018-03-01'),
          endDate: new Date('2019-12-01'),
          isCurrent: false,
          description: 'Designed user interfaces for SaaS products, created design systems, and collaborated with development teams.'
        }
      ],
      portfolio: [
        {
          id: '1',
          title: 'Mobile Banking App',
          description: 'Complete UI/UX design for a modern mobile banking application with focus on security and user experience.',
          coverImage: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=600&h=400&fit=crop',
          projectUrl: 'https://example-banking.com',
          createdDate: new Date('2024-06-15'),
          isPublic: true
        },
        {
          id: '2',
          title: 'E-learning Platform',
          description: 'Educational platform design with interactive elements and gamification features.',
          coverImage: 'https://images.unsplash.com/photo-1501504905252-473c47e087f8?w=600&h=400&fit=crop',
          projectUrl: 'https://example-learning.com',
          createdDate: new Date('2024-04-20'),
          isPublic: true
        }
      ],
      rating: 4.9,
      totalReviews: 32,
      reviews: [
        {
          id: '1',
          reviewerName: 'Alex Thompson',
          reviewerAvatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=50&h=50&fit=crop&crop=face',
          rating: 5,
          comment: 'Exceptional design skills and great attention to detail. Highly recommend Sarah for any design project!',
          projectTitle: 'Mobile Banking App',
          date: new Date('2024-07-15')
        }
      ],
      languages: ['English', 'Spanish'],
      location: 'Barcelona, Spain',
      hourlyRate: 75,
      availability: 'available',
      joinedDate: new Date('2019-05-20'),
      lastActive: new Date('2024-12-19T14:20:00')
    },
    'mike_backend': {
      id: '3',
      username: 'mike_backend',
      role: 'freelancer',
      isVerified: false,
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
      bio: 'Backend developer specializing in Node.js, Python, and cloud architecture. Experienced in building scalable microservices and APIs.',
      skills: ['Node.js', 'Python', 'AWS', 'Docker', 'PostgreSQL', 'Redis', 'GraphQL', 'Microservices'],
      experience: [
        {
          id: '1',
          title: 'Backend Developer',
          company: 'CloudTech Solutions',
          startDate: new Date('2021-06-01'),
          endDate: undefined,
          isCurrent: true,
          description: 'Developing cloud-native applications and API services for enterprise clients.'
        }
      ],
      portfolio: [
        {
          id: '1',
          title: 'RESTful API Service',
          description: 'Scalable API service handling millions of requests with high performance and reliability.',
          coverImage: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=600&h=400&fit=crop',
          projectUrl: 'https://github.com/mike/api-service',
          createdDate: new Date('2024-05-10'),
          isPublic: true
        }
      ],
      rating: 4.6,
      totalReviews: 18,
      reviews: [
        {
          id: '1',
          reviewerName: 'Jennifer Lee',
          rating: 5,
          comment: 'Solid backend work and good communication throughout the project.',
          projectTitle: 'API Development',
          date: new Date('2024-06-20')
        }
      ],
      languages: ['English'],
      location: 'Toronto, Canada',
      hourlyRate: 65,
      availability: 'busy',
      joinedDate: new Date('2021-03-10'),
      lastActive: new Date('2024-12-18T09:45:00')
    }
  };

 

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    public translate: TranslateService // Inject the service. 'public' makes it accessible in the template.
  ) {}

  ngOnInit(): void {
    // Check if we're viewing a specific user's profile
    this.route.params.subscribe(params => {
      this.viewedUsername = params['username'];
      this.isViewingOtherProfile = !!this.viewedUsername;
      this.loadUserProfile();
      this.initializeForms();
    });
  }

  loadUserProfile(): void {
    if (this.isViewingOtherProfile && this.viewedUsername) {
      // Load the talent's profile
      const talentProfile = this.mockTalentProfiles[this.viewedUsername];
      if (talentProfile) {
        this.currentUser = talentProfile;
      } else {
        // Handle case where talent is not found
        console.error('Talent profile not found');
        this.router.navigate(['/talent-discovery']);
      }
    } else {
      // Load current user's profile (your own profile)
      this.currentUser = this.mockUser;
    }
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
      github: [this.currentUser?.socialLinks?.github || '', [Validators.pattern(/^https?:\/\/(www\.)?github\.com\/.*$/)]],
      stackoverflow: [this.currentUser?.socialLinks?.stackoverflow || '', [Validators.pattern(/^https?:\/\/(www\.)?stackoverflow\.com\/.*$/)]],
      linkedin: [this.currentUser?.socialLinks?.linkedin || '', [Validators.pattern(/^https?:\/\/(www\.)?linkedin\.com\/.*$/)]],
      website: [this.currentUser?.socialLinks?.website || '', [Validators.pattern(/^https?:\/\/.*$/)]]
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
      skillsText: [this.currentUser?.skills?.join(', ') || '', [Validators.required]]
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

  hasSocialLinks(): boolean {
    return !!(this.currentUser.socialLinks && Object.keys(this.currentUser.socialLinks).some(key => 
      this.currentUser.socialLinks![key as keyof SocialLinks]
    ));
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
    alert('Add experience functionality will be implemented');
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
          this.currentUser.resumeFileName = this.selectedResumeFile!.name;
          this.currentUser.resumeUrl = URL.createObjectURL(this.selectedResumeFile!);
          this.currentUser.resumeUploadedDate = new Date();
          this.selectedResumeFile = null;
          this.isLoading = false;
          this.resumeUploadProgress = 0;
          alert('Resume uploaded successfully!');
        }
      }, 100);
    }
  }

  removeResume(): void {
    if (confirm('Are you sure you want to remove your resume?')) {
      this.currentUser.resumeFileName = undefined;
      this.currentUser.resumeUrl = undefined;
      this.currentUser.resumeUploadedDate = undefined;
      alert('Resume removed successfully!');
    }
  }

  downloadResume(): void {
    if (this.currentUser.resumeUrl) {
      const link = document.createElement('a');
      link.href = this.currentUser.resumeUrl;
      link.download = this.currentUser.resumeFileName || 'resume.pdf';
      link.click();
    }
  }

  // Education Modal Methods
  openEducationModal(education?: EducationItem): void {
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
    if (this.educationForm.valid) {
      this.isLoading = true;
      const formValue = this.educationForm.value;

      if (this.isEditingEducation && this.editingEducationId) {
        // Update existing education
        const index = this.currentUser.education!.findIndex(edu => edu.id === this.editingEducationId);
        if (index !== -1) {
          this.currentUser.education![index] = {
            ...this.currentUser.education![index],
            degree: formValue.degree,
            institution: formValue.institution,
            startYear: formValue.startYear,
            endYear: formValue.endYear || undefined,
            description: formValue.description,
            gpa: formValue.gpa
          };
        }
      } else {
        // Add new education
        if (!this.currentUser.education) {
          this.currentUser.education = [];
        }
        const newEducation: EducationItem = {
          id: Date.now().toString(),
          degree: formValue.degree,
          institution: formValue.institution,
          startYear: formValue.startYear,
          endYear: formValue.endYear || undefined,
          description: formValue.description,
          gpa: formValue.gpa
        };
        this.currentUser.education.unshift(newEducation);
      }

      setTimeout(() => {
        this.isLoading = false;
        this.closeEducationModal();
        alert(this.isEditingEducation ? 'Education updated successfully!' : 'Education added successfully!');
      }, 1000);
    }
  }

  // Certification Modal Methods
  openCertificationModal(certification?: CertificationItem): void {
    this.showCertificationModal = true;
    this.isEditingCertification = !!certification;
    this.editingCertificationId = certification?.id || null;

    if (certification) {
      this.certificationForm.patchValue({
        name: certification.name,
        issuer: certification.issuer,
        issueDate: certification.issueDate.toISOString().split('T')[0],
        expiryDate: certification.expiryDate ? certification.expiryDate.toISOString().split('T')[0] : '',
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
    if (this.certificationForm.valid) {
      this.isLoading = true;
      const formValue = this.certificationForm.value;

      if (this.isEditingCertification && this.editingCertificationId) {
        // Update existing certification
        const index = this.currentUser.certifications!.findIndex(cert => cert.id === this.editingCertificationId);
        if (index !== -1) {
          this.currentUser.certifications![index] = {
            ...this.currentUser.certifications![index],
            name: formValue.name,
            issuer: formValue.issuer,
            issueDate: new Date(formValue.issueDate),
            expiryDate: formValue.expiryDate ? new Date(formValue.expiryDate) : undefined,
            credentialId: formValue.credentialId,
            credentialUrl: formValue.credentialUrl
          };
        }
      } else {
        // Add new certification
        if (!this.currentUser.certifications) {
          this.currentUser.certifications = [];
        }
        const newCertification: CertificationItem = {
          id: Date.now().toString(),
          name: formValue.name,
          issuer: formValue.issuer,
          issueDate: new Date(formValue.issueDate),
          expiryDate: formValue.expiryDate ? new Date(formValue.expiryDate) : undefined,
          credentialId: formValue.credentialId,
          credentialUrl: formValue.credentialUrl
        };
        this.currentUser.certifications.unshift(newCertification);
      }

      setTimeout(() => {
        this.isLoading = false;
        this.closeCertificationModal();
        alert(this.isEditingCertification ? 'Certification updated successfully!' : 'Certification added successfully!');
      }, 1000);
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
    if (this.languagesForm.valid) {
      this.isLoading = true;
      const formValue = this.languagesForm.value;
      this.currentUser.languages = formValue.languages.split(',').map((lang: string) => lang.trim()).filter((lang: string) => lang);

      setTimeout(() => {
        this.isLoading = false;
        this.closeLanguagesModal();
        alert('Languages updated successfully!');
      }, 1000);
    }
  }

  // Social Links Modal Methods
  openSocialLinksModal(): void {
    this.showSocialLinksModal = true;
    this.socialLinksForm.patchValue({
      github: this.currentUser?.socialLinks?.github || '',
      stackoverflow: this.currentUser?.socialLinks?.stackoverflow || '',
      linkedin: this.currentUser?.socialLinks?.linkedin || '',
      website: this.currentUser?.socialLinks?.website || ''
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
      
      if (!this.currentUser.socialLinks) {
        this.currentUser.socialLinks = {};
      }
      
      this.currentUser.socialLinks.github = formValue.github || undefined;
      this.currentUser.socialLinks.stackoverflow = formValue.stackoverflow || undefined;
      this.currentUser.socialLinks.linkedin = formValue.linkedin || undefined;
      this.currentUser.socialLinks.website = formValue.website || undefined;

      setTimeout(() => {
        this.isLoading = false;
        this.closeSocialLinksModal();
        alert('Social links updated successfully!');
      }, 1000);
    }
  }

  // Work History Modal Methods
  openWorkHistoryModal(workItem?: any): void {
    this.showWorkHistoryModal = true;
    this.editingWorkHistory = workItem || null;

    if (workItem) {
      this.workHistoryForm.patchValue({
        title: workItem.title,
        company: workItem.company,
        startDate: workItem.startDate.toISOString().split('T')[0],
        endDate: workItem.endDate ? workItem.endDate.toISOString().split('T')[0] : '',
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
    if (this.workHistoryForm.valid) {
      this.isLoading = true;
      const formValue = this.workHistoryForm.value;

      if (this.editingWorkHistory) {
        // Update existing work history
        const index = this.currentUser.experience!.findIndex(exp => exp.id === this.editingWorkHistory.id);
        if (index !== -1) {
          this.currentUser.experience![index] = {
            ...this.currentUser.experience![index],
            title: formValue.title,
            company: formValue.company,
            startDate: new Date(formValue.startDate),
            endDate: formValue.endDate ? new Date(formValue.endDate) : undefined,
            isCurrent: formValue.isCurrent,
            description: formValue.description
          };
        }
      } else {
        // Add new work history
        if (!this.currentUser.experience) {
          this.currentUser.experience = [];
        }
        const newWork = {
          id: Date.now().toString(),
          title: formValue.title,
          company: formValue.company,
          startDate: new Date(formValue.startDate),
          endDate: formValue.endDate ? new Date(formValue.endDate) : undefined,
          isCurrent: formValue.isCurrent,
          description: formValue.description
        };
        this.currentUser.experience.unshift(newWork);
      }

      setTimeout(() => {
        this.isLoading = false;
        this.closeWorkHistoryModal();
        alert(this.editingWorkHistory ? 'Work history updated successfully!' : 'Work history added successfully!');
      }, 1000);
    }
  }

  // Skills Modal Methods
  openSkillsModal(): void {
    this.showSkillsModal = true;
    this.skillsForm.patchValue({
      skillsText: this.currentUser?.skills?.join(', ') || ''
    });
  }

  closeSkillsModal(): void {
    this.showSkillsModal = false;
    this.skillsForm.reset();
  }

  saveSkills(): void {
    if (this.skillsForm.valid) {
      this.isLoading = true;
      const formValue = this.skillsForm.value;
      this.currentUser.skills = formValue.skillsText.split(',').map((skill: string) => skill.trim()).filter((skill: string) => skill);

      setTimeout(() => {
        this.isLoading = false;
        this.closeSkillsModal();
        alert('Skills updated successfully!');
      }, 1000);
    }
  }

  // Public View Toggle
  togglePublicView(): void {
    this.isPublicView = !this.isPublicView;
  }
}