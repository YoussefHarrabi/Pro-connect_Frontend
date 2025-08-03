import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ProjectCategory } from '../../../shared/models/project';
import { ProjectMarketplaceService } from '../../../shared/services/project-marketplace.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { SharedNavbar, NavbarConfig } from '../../../shared/components/shared-navbar/shared-navbar';
import { SharedFooter } from '../../../shared/components/shared-footer/shared-footer';


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

  availableSkills: string[] = [];
  selectedSkills: string[] = [];
  categories: { value: ProjectCategory; label: string; icon: string }[] = [];

  steps = [
    { title: 'projectPosting.steps.projectDetails', description: 'projectPosting.steps.projectDetailsDesc' },
    { title: 'projectPosting.steps.budgetTimeline', description: 'projectPosting.steps.budgetTimelineDesc' },
    { title: 'projectPosting.steps.additionalDetails', description: 'projectPosting.steps.additionalDetailsDesc' }
  ];

  complexityLevels = [
    { 
      value: 'entry', 
      label: 'Entry Level', 
      icon: '🌱',
      description: 'Basic knowledge required'
    },
    { 
      value: 'intermediate', 
      label: 'Intermediate', 
      icon: '🚀',
      description: 'Specialized knowledge needed'
    },
    { 
      value: 'expert', 
      label: 'Expert', 
      icon: '⭐',
      description: 'Extensive experience required'
    }
  ];

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private projectService: ProjectMarketplaceService,
    public translate: TranslateService
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    this.loadData();
  }

  initializeForm(): void {
    this.projectForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(100)]],
      description: ['', [Validators.required, Validators.minLength(50), Validators.maxLength(2000)]],
      category: ['', Validators.required],
      skills: [[]],
      projectType: ['', Validators.required],
      budgetMin: ['', [Validators.required, Validators.min(1)]],
      budgetMax: ['', [Validators.required, Validators.min(1)]],
      budgetNegotiable: [false],
      timeline: ['', Validators.required],
      complexity: ['intermediate', Validators.required],
      preferredTalentType: ['both'],
      experienceLevel: ['intermediate'],
      location: [''],
      isRemote: [true],
      isUrgent: [false],
      isFeatured: [false],
      deadline: ['']
    });
  }

  loadData(): void {
    this.availableSkills = this.projectService.getAvailableSkills();
    this.categories = this.projectService.getProjectCategories();
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
        return step2Fields.every(field => this.projectForm.get(field)?.valid);
      case 3:
        return true; // Step 3 fields are mostly optional
      default:
        return false;
    }
  }

  markCurrentStepTouched(): void {
    switch (this.currentStep) {
      case 1:
        ['title', 'description', 'category'].forEach(field => {
          this.projectForm.get(field)?.markAsTouched();
        });
        break;
      case 2:
        ['projectType', 'budgetMin', 'budgetMax', 'timeline', 'complexity'].forEach(field => {
          this.projectForm.get(field)?.markAsTouched();
        });
        break;
    }
  }

  selectProjectType(type: 'fixed' | 'hourly'): void {
    this.projectForm.patchValue({ projectType: type });
  }

  selectComplexity(complexity: string): void {
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

  onSubmit(): void {
    if (this.projectForm.valid && this.selectedSkills.length > 0) {
      this.isLoading = true;
      
      const formValue = this.projectForm.value;
      const projectData = {
        ...formValue,
        skills: this.selectedSkills,
        budget: {
          type: formValue.projectType,
          min: formValue.budgetMin,
          max: formValue.budgetMax,
          currency: 'EUR' as const,
          isNegotiable: formValue.budgetNegotiable
        },
        timeline: {
          duration: formValue.timeline,
          isFlexible: false
        },
        clientId: 'current-user-id',
        clientName: 'Current User',
        clientRating: 4.5,
        clientReviews: 10
      };

      this.projectService.createProject(projectData).subscribe({
        next: (project) => {
          this.isLoading = false;
          alert('Project published successfully!');
          this.router.navigate(['/project-discovery']);
        },
        error: (error) => {
          this.isLoading = false;
          alert('Error publishing project. Please try again.');
        }
      });
    } else {
      this.markCurrentStepTouched();
    }
  }

saveDraft(): void {
    this.isLoading = true;
    setTimeout(() => {
      this.isLoading = false;
      alert('Draft saved successfully!');
    }, 1000);
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
}