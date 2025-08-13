import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { SharedNavbar, NavbarConfig } from '../../../shared/components/shared-navbar/shared-navbar';
import { SharedFooter } from '../../../shared/components/shared-footer/shared-footer';

// ✅ Import the new ProjectService instead of ProjectMarketplaceService
import { 
  ProjectService, 
  ProjectCreateRequest, 
  ProjectCategory, 
  ProjectType, 
  ComplexityLevel, 
  TalentType, 
  ExperienceLevel 
} from '../../../shared/services/project.service';

// ✅ Import UserService for skills
import { UserService } from '../../../shared/services/user.service';

@Component({
  selector: 'app-project-posting',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    TranslateModule,
    SharedNavbar,
    SharedFooter
  ],
  templateUrl: './project-posting.html',
  styleUrl: './project-posting.scss'
})
export class ProjectPosting implements OnInit {
  projectForm!: FormGroup;
  currentStep = 1;
  totalSteps = 3;
  isLoading = false;
  today = new Date().toISOString().split('T')[0];

  navbarConfig: NavbarConfig = {
    title: 'projectPosting.header.title',
    showLanguageToggle: true,
    showProfileLink: true,
    customButtons: [
      {
        label: 'projectPosting.header.dashboard',
        route: '/client-dashboard',
        class: 'px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors duration-200'
      }
    ]
  };

  // ✅ Updated to use proper types
  availableSkills: string[] = [];
  selectedSkills: string[] = [];
  categories: Array<{value: ProjectCategory; label: string; icon: string}> = [];

  steps = [
    { title: 'projectPosting.steps.projectDetails', description: 'projectPosting.steps.projectDetailsDesc' },
    { title: 'projectPosting.steps.budgetTimeline', description: 'projectPosting.steps.budgetTimelineDesc' },
    { title: 'projectPosting.steps.additionalDetails', description: 'projectPosting.steps.additionalDetailsDesc' }
  ];

  // ✅ Updated to match backend enums
  complexityLevels = [
    { 
      value: ComplexityLevel.ENTRY, 
      label: 'Entry Level', 
      icon: '🌱',
      description: 'Basic knowledge required'
    },
    { 
      value: ComplexityLevel.INTERMEDIATE, 
      label: 'Intermediate', 
      icon: '🚀',
      description: 'Specialized knowledge needed'
    },
    { 
      value: ComplexityLevel.EXPERT, 
      label: 'Expert', 
      icon: '⭐',
      description: 'Extensive experience required'
    }
  ];

  // ✅ Expose enums for template
  ProjectType = ProjectType;
  TalentType = TalentType;
  ExperienceLevel = ExperienceLevel;
  ComplexityLevel = ComplexityLevel;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private projectService: ProjectService, // ✅ Use new ProjectService
    private userService: UserService, // ✅ Add UserService for skills
    public translate: TranslateService
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    this.loadData();
  }

  initializeForm(): void {
    this.projectForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(150)]],
      description: ['', [Validators.required, Validators.minLength(50), Validators.maxLength(2000)]],
      category: ['', Validators.required],
      skills: [[]],
      projectType: ['', Validators.required],
      budgetMin: ['', [Validators.required, Validators.min(1)]],
      budgetMax: ['', [Validators.required, Validators.min(1)]],
      budgetNegotiable: [false],
      timeline: ['', Validators.required],
      complexity: [ComplexityLevel.INTERMEDIATE, Validators.required],
      preferredTalentType: [TalentType.BOTH],
      experienceLevel: [ExperienceLevel.INTERMEDIATE],
      location: [''],
      isRemote: [true],
      isUrgent: [false],
      isFeatured: [false],
      deadline: ['']
    });
  }

  // ✅ Updated to load data from new services
  loadData(): void {
    this.loadSkills();
    this.loadCategories();
  }

  loadSkills(): void {
    this.userService.getAllSkills().subscribe({
      next: (skills) => {
        this.availableSkills = skills.map(skill => skill.name);
        console.log('✅ Loaded skills:', this.availableSkills.length);
      },
      error: (error) => {
        console.error('❌ Error loading skills:', error);
        // Fallback to hardcoded skills
        this.availableSkills = [
          'JavaScript', 'TypeScript', 'React', 'Angular', 'Vue.js', 'Node.js',
          'Python', 'Java', 'C#', 'PHP', 'Laravel', 'Django', 'Flask',
          'MySQL', 'PostgreSQL', 'MongoDB', 'Redis',
          'HTML', 'CSS', 'Sass', 'Bootstrap', 'Tailwind CSS',
          'Git', 'Docker', 'AWS', 'Azure', 'Google Cloud',
          'UI/UX Design', 'Figma', 'Adobe XD', 'Photoshop'
        ];
      }
    });
  }

  loadCategories(): void {
    this.projectService.getProjectCategories().subscribe({
      next: (categories) => {
        this.categories = categories.map(cat => ({
          value: cat.value as ProjectCategory,
          label: cat.label,
          icon: this.getCategoryIcon(cat.value as ProjectCategory)
        }));
        console.log('✅ Loaded categories:', this.categories.length);
      },
      error: (error) => {
        console.error('❌ Error loading categories:', error);
        // Fallback to hardcoded categories
        this.categories = [
          { value: ProjectCategory.WEB_DEVELOPMENT, label: 'Web Development', icon: '💻' },
          { value: ProjectCategory.MOBILE_DEVELOPMENT, label: 'Mobile Development', icon: '📱' },
          { value: ProjectCategory.DESIGN_CREATIVE, label: 'Design & Creative', icon: '🎨' },
          { value: ProjectCategory.DATA_SCIENCE, label: 'Data Science', icon: '📊' },
          { value: ProjectCategory.MARKETING_SALES, label: 'Marketing & Sales', icon: '📈' },
          { value: ProjectCategory.WRITING_TRANSLATION, label: 'Writing & Translation', icon: '✍️' },
          { value: ProjectCategory.OTHER, label: 'Other', icon: '🔧' }
        ];
      }
    });
  }

  getCategoryIcon(category: ProjectCategory): string {
    const icons: Record<ProjectCategory, string> = {
      [ProjectCategory.WEB_DEVELOPMENT]: '💻',
      [ProjectCategory.MOBILE_DEVELOPMENT]: '📱',
      [ProjectCategory.DESKTOP_DEVELOPMENT]: '🖥️',
      [ProjectCategory.DESIGN_CREATIVE]: '🎨',
      [ProjectCategory.DATA_SCIENCE]: '📊',
      [ProjectCategory.MARKETING_SALES]: '📈',
      [ProjectCategory.WRITING_TRANSLATION]: '✍️',
      [ProjectCategory.BUSINESS_CONSULTING]: '💼',
      [ProjectCategory.ENGINEERING_ARCHITECTURE]: '🏗️',
      [ProjectCategory.LEGAL]: '⚖️',
      [ProjectCategory.FINANCE_ACCOUNTING]: '💰',
      [ProjectCategory.MUSIC_AUDIO]: '🎵',
      [ProjectCategory.VIDEO_ANIMATION]: '🎬',
      [ProjectCategory.PHOTOGRAPHY]: '📸',
      [ProjectCategory.OTHER]: '🔧'
    };
    return icons[category] || '🔧';
  }

  nextStep(): void {
    if (this.isCurrentStepValid()) {
      this.currentStep++;
    } else {
      this.markCurrentStepTouched();
    }
  }

  previousStep(): void {
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }

  isCurrentStepValid(): boolean {
    switch (this.currentStep) {
      case 1:
        const step1Fields = ['title', 'description', 'category'];
        const step1Valid = step1Fields.every(field => this.projectForm.get(field)?.valid);
        return step1Valid && this.selectedSkills.length > 0;
      case 2:
        const step2Fields = ['projectType', 'budgetMin', 'budgetMax', 'timeline', 'complexity'];
        const isValidBudget = this.validateBudgetRange();
        return step2Fields.every(field => this.projectForm.get(field)?.valid) && isValidBudget;
      case 3:
        return true; // Step 3 fields are mostly optional
      default:
        return false;
    }
  }

  validateBudgetRange(): boolean {
    const budgetMin = this.projectForm.get('budgetMin')?.value;
    const budgetMax = this.projectForm.get('budgetMax')?.value;
    
    if (!budgetMin || !budgetMax) return false;
    return parseFloat(budgetMin) <= parseFloat(budgetMax);
  }

  markCurrentStepTouched(): void {
    switch (this.currentStep) {
      case 1:
        ['title', 'description', 'category'].forEach(field => {
          this.projectForm.get(field)?.markAsTouched();
        });
        if (this.selectedSkills.length === 0) {
          this.projectForm.get('skills')?.markAsTouched();
        }
        break;
      case 2:
        ['projectType', 'budgetMin', 'budgetMax', 'timeline', 'complexity'].forEach(field => {
          this.projectForm.get(field)?.markAsTouched();
        });
        break;
    }
  }

  // ✅ Updated to use enum values
  selectProjectType(type: ProjectType): void {
    this.projectForm.patchValue({ projectType: type });
  }

  selectComplexity(complexity: ComplexityLevel): void {
    this.projectForm.patchValue({ complexity });
  }

  toggleSkill(skill: string): void {
    const index = this.selectedSkills.indexOf(skill);
    if (index > -1) {
      this.selectedSkills.splice(index, 1);
    } else {
      this.selectedSkills.push(skill);
    }
    this.projectForm.patchValue({ skills: this.selectedSkills });
  }

  removeSkill(skill: string): void {
    const index = this.selectedSkills.indexOf(skill);
    if (index > -1) {
      this.selectedSkills.splice(index, 1);
      this.projectForm.patchValue({ skills: this.selectedSkills });
    }
  }

  // ✅ Updated onSubmit to use new ProjectService
  onSubmit(): void {
    if (this.projectForm.valid && this.selectedSkills.length > 0 && this.validateBudgetRange()) {
      this.isLoading = true;
      
      const formValue = this.projectForm.value;
      
      // ✅ Create proper ProjectCreateRequest
      const projectRequest: ProjectCreateRequest = {
        title: formValue.title,
        description: formValue.description,
        category: formValue.category,
        skills: this.selectedSkills,
        projectType: formValue.projectType,
        budgetMin: parseFloat(formValue.budgetMin),
        budgetMax: parseFloat(formValue.budgetMax),
        currency: 'EUR',
        budgetNegotiable: formValue.budgetNegotiable || false,
        timeline: formValue.timeline,
        complexity: formValue.complexity || ComplexityLevel.INTERMEDIATE,
        preferredTalentType: formValue.preferredTalentType || TalentType.BOTH,
        experienceLevel: formValue.experienceLevel || ExperienceLevel.INTERMEDIATE,
        location: formValue.location || null,
        isRemote: formValue.isRemote !== false, // Default to true
        isUrgent: formValue.isUrgent || false,
        isFeatured: formValue.isFeatured || false,
        deadline: formValue.deadline || null
      };

      // ✅ Validate project before submission
      const validationErrors = this.projectService.validateProject(projectRequest);
      if (validationErrors.length > 0) {
        this.isLoading = false;
        alert('Validation errors:\n' + validationErrors.join('\n'));
        return;
      }

      // ✅ Create project using ProjectService
      this.projectService.createProject(projectRequest).subscribe({
        next: (project) => {
          this.isLoading = false;
          console.log('✅ Project created successfully:', project);
          alert('Project published successfully!');
          this.router.navigate(['/project-discovery']);
        },
        error: (error) => {
          this.isLoading = false;
          console.error('❌ Error creating project:', error);
          
          let errorMessage = 'Error publishing project. Please try again.';
          if (error.error && error.error.error) {
            errorMessage = error.error.error;
          }
          alert(errorMessage);
        }
      });
    } else {
      this.markCurrentStepTouched();
      
      // Show specific validation errors
      if (this.selectedSkills.length === 0) {
        alert('Please select at least one skill for your project.');
      } else if (!this.validateBudgetRange()) {
        alert('Minimum budget cannot be greater than maximum budget.');
      } else {
        alert('Please fill in all required fields correctly.');
      }
    }
  }

  // ✅ Updated saveDraft to use ProjectService
  saveDraft(): void {
    if (this.selectedSkills.length > 0) {
      this.isLoading = true;
      
      const formValue = this.projectForm.value;
      
      const projectRequest: ProjectCreateRequest = {
        title: formValue.title || 'Draft Project',
        description: formValue.description || 'Draft description',
        category: formValue.category || ProjectCategory.OTHER,
        skills: this.selectedSkills,
        projectType: formValue.projectType || ProjectType.FIXED,
        budgetMin: parseFloat(formValue.budgetMin) || 100,
        budgetMax: parseFloat(formValue.budgetMax) || 1000,
        currency: 'EUR',
        budgetNegotiable: formValue.budgetNegotiable || false,
        timeline: formValue.timeline || '1-2-weeks',
        complexity: formValue.complexity || ComplexityLevel.INTERMEDIATE,
        preferredTalentType: formValue.preferredTalentType || TalentType.BOTH,
        experienceLevel: formValue.experienceLevel || ExperienceLevel.INTERMEDIATE,
        location: formValue.location || null,
        isRemote: formValue.isRemote !== false,
        isUrgent: formValue.isUrgent || false,
        isFeatured: formValue.isFeatured || false,
        deadline: formValue.deadline || null
      };

      this.projectService.saveProjectDraft(projectRequest).subscribe({
        next: (project) => {
          this.isLoading = false;
          console.log('✅ Draft saved successfully:', project);
          alert('Draft saved successfully!');
        },
        error: (error) => {
          this.isLoading = false;
          console.error('❌ Error saving draft:', error);
          alert('Error saving draft. Please try again.');
        }
      });
    } else {
      alert('Please select at least one skill before saving draft.');
    }
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.projectForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getErrorMessage(fieldName: string): string {
    const control = this.projectForm.get(fieldName);
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

  // ✅ Helper methods for template
  getComplexityLabel(complexity: ComplexityLevel): string {
    return this.projectService.getComplexityLabel(complexity);
  }

  getTimelineLabel(timeline: string): string {
    return this.projectService.getTimelineLabel(timeline);
  }
}