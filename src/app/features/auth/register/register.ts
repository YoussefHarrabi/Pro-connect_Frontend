import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

export interface UserRole {
  id: string;
  name: string;
  description: string;
  icon: string;
  features: string[];
}

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule
  ],
  templateUrl: './register.html',
  styleUrl: './register.scss'
})
export class Register implements OnInit {
  registerForm!: FormGroup;
  selectedRole: string = '';
  isLoading = false;
  currentStep = 1;
  totalSteps = 3; // Added third step for role-specific fields

  userRoles: UserRole[] = [
    {
      id: 'service_company',
      name: 'Service Company',
      description: 'Société de Services - Promote your pool of engineers and secure contracts',
      icon: '🏢',
      features: [
        'Manage multiple engineers',
        'Team project assignments',
        'Company profile showcase',
        'Bulk project applications'
      ]
    },
    {
      id: 'freelancer',
      name: 'Freelance Developer',
      description: 'Individual Developer - Market your skills and find projects',
      icon: '💻',
      features: [
        'Personal portfolio showcase',
        'Direct client communication',
        'Flexible project selection',
        'Individual skill assessment'
      ]
    },
    {
      id: 'client',
      name: 'Client',
      description: 'Find, vet, and engage qualified technical professionals',
      icon: '🎯',
      features: [
        'Post project requirements',
        'Access talent database',
        'Review and rating system',
        'Secure project management'
      ]
    }
  ];

  constructor(
    private fb: FormBuilder,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.initializeForm();
  }

  private initializeForm(): void {
    this.registerForm = this.fb.group({
      // Step 1: Role Selection
      role: ['', Validators.required],
      
      // Step 2: Account Creation
      username: ['', [
        Validators.required, 
        Validators.minLength(3), 
        Validators.maxLength(20),
        Validators.pattern(/^[a-zA-Z0-9_]+$/)
      ]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required],
      
      // Step 3: Role-specific fields
      // Common fields
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, Validators.pattern(/^\+?[\d\s\-\(\)]+$/)]],
      location: ['', Validators.required],
      
      // Service Company specific
      companyName: [''],
      companySize: [''],
      establishedYear: [''],
      website: [''],
      companyDescription: [''],
      
      // Freelancer specific
      specialization: [''],
      experienceLevel: [''],
      hourlyRate: [''],
      availableHours: [''],
      skills: [''],
      
      // Client specific
      industry: [''],
      companyType: [''],
      projectBudgetRange: [''],
      preferredProjectDuration: [''],
      
      // Final
      terms: [false, Validators.requiredTrue]
    }, { validators: this.passwordMatchValidator });
  }

  passwordMatchValidator(form: FormGroup) {
    const password = form.get('password');
    const confirmPassword = form.get('confirmPassword');
    
    if (password && confirmPassword && password.value !== confirmPassword.value) {
      confirmPassword.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }
    
    if (confirmPassword?.hasError('passwordMismatch')) {
      delete confirmPassword.errors!['passwordMismatch'];
      if (Object.keys(confirmPassword.errors!).length === 0) {
        confirmPassword.setErrors(null);
      }
    }
    
    return null;
  }

  selectRole(roleId: string): void {
    this.selectedRole = roleId;
    this.registerForm.patchValue({ role: roleId });
    this.updateValidatorsForRole(roleId);
  }

  private updateValidatorsForRole(roleId: string): void {
    // Clear all conditional validators first
    this.clearRoleSpecificValidators();

    // Add validators based on role
    switch (roleId) {
      case 'service_company':
        this.registerForm.get('companyName')?.setValidators([Validators.required]);
        this.registerForm.get('companySize')?.setValidators([Validators.required]);
        this.registerForm.get('establishedYear')?.setValidators([Validators.required, Validators.min(1900), Validators.max(new Date().getFullYear())]);
        this.registerForm.get('companyDescription')?.setValidators([Validators.required, Validators.minLength(50)]);
        break;
        
      case 'freelancer':
        this.registerForm.get('specialization')?.setValidators([Validators.required]);
        this.registerForm.get('experienceLevel')?.setValidators([Validators.required]);
        this.registerForm.get('hourlyRate')?.setValidators([Validators.required, Validators.min(1)]);
        this.registerForm.get('availableHours')?.setValidators([Validators.required]);
        this.registerForm.get('skills')?.setValidators([Validators.required, Validators.minLength(10)]);
        break;
        
      case 'client':
        this.registerForm.get('industry')?.setValidators([Validators.required]);
        this.registerForm.get('companyType')?.setValidators([Validators.required]);
        this.registerForm.get('projectBudgetRange')?.setValidators([Validators.required]);
        this.registerForm.get('preferredProjectDuration')?.setValidators([Validators.required]);
        break;
    }

    // Update validity
    this.updateFormValidation();
  }

  private clearRoleSpecificValidators(): void {
    const roleFields = [
      'companyName', 'companySize', 'establishedYear', 'website', 'companyDescription',
      'specialization', 'experienceLevel', 'hourlyRate', 'availableHours', 'skills',
      'industry', 'companyType', 'projectBudgetRange', 'preferredProjectDuration'
    ];
    
    roleFields.forEach(field => {
      this.registerForm.get(field)?.clearValidators();
    });
  }

  private updateFormValidation(): void {
    Object.keys(this.registerForm.controls).forEach(key => {
      this.registerForm.get(key)?.updateValueAndValidity();
    });
  }

  nextStep(): void {
    if (this.currentStep < this.totalSteps) {
      if (this.isCurrentStepValid()) {
        this.currentStep++;
      } else {
        this.markCurrentStepTouched();
      }
    }
  }

  previousStep(): void {
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }

  private isCurrentStepValid(): boolean {
    switch (this.currentStep) {
      case 1:
        return this.registerForm.get('role')?.valid || false;
      case 2:
        const accountFields = ['username', 'password', 'confirmPassword'];
        return accountFields.every(field => this.registerForm.get(field)?.valid);
      case 3:
        return this.isStep3Valid();
      default:
        return false;
    }
  }

  private isStep3Valid(): boolean {
    const commonFields = ['firstName', 'lastName', 'email', 'phone', 'location', 'terms'];
    const commonValid = commonFields.every(field => this.registerForm.get(field)?.valid);
    
    if (!commonValid) return false;

    // Check role-specific fields
    switch (this.selectedRole) {
      case 'service_company':
        const companyFields = ['companyName', 'companySize', 'establishedYear', 'companyDescription'];
        return companyFields.every(field => this.registerForm.get(field)?.valid);
      case 'freelancer':
        const freelancerFields = ['specialization', 'experienceLevel', 'hourlyRate', 'availableHours', 'skills'];
        return freelancerFields.every(field => this.registerForm.get(field)?.valid);
      case 'client':
        const clientFields = ['industry', 'companyType', 'projectBudgetRange', 'preferredProjectDuration'];
        return clientFields.every(field => this.registerForm.get(field)?.valid);
      default:
        return true;
    }
  }

  private markCurrentStepTouched(): void {
    switch (this.currentStep) {
      case 1:
        this.registerForm.get('role')?.markAsTouched();
        break;
      case 2:
        ['username', 'password', 'confirmPassword'].forEach(field => {
          this.registerForm.get(field)?.markAsTouched();
        });
        break;
      case 3:
        this.markStep3Touched();
        break;
    }
  }

  private markStep3Touched(): void {
    const commonFields = ['firstName', 'lastName', 'email', 'phone', 'location', 'terms'];
    commonFields.forEach(field => {
      this.registerForm.get(field)?.markAsTouched();
    });

    // Mark role-specific fields as touched
    switch (this.selectedRole) {
      case 'service_company':
        ['companyName', 'companySize', 'establishedYear', 'companyDescription'].forEach(field => {
          this.registerForm.get(field)?.markAsTouched();
        });
        break;
      case 'freelancer':
        ['specialization', 'experienceLevel', 'hourlyRate', 'availableHours', 'skills'].forEach(field => {
          this.registerForm.get(field)?.markAsTouched();
        });
        break;
      case 'client':
        ['industry', 'companyType', 'projectBudgetRange', 'preferredProjectDuration'].forEach(field => {
          this.registerForm.get(field)?.markAsTouched();
        });
        break;
    }
  }

  onSubmit(): void {
    if (this.registerForm.valid) {
      this.isLoading = true;
      console.log('Registration attempt:', this.registerForm.value);
      
      // Simulate API call
      setTimeout(() => {
        this.isLoading = false;
        alert('Registration successful! Please login with your credentials.');
        this.router.navigate(['/auth/login']);
      }, 2000);
    } else {
      this.markCurrentStepTouched();
    }
  }

  onLogin(): void {
    this.router.navigate(['/auth/login']);
  }

  getErrorMessage(fieldName: string): string {
    const control = this.registerForm.get(fieldName);
    if (control?.hasError('required')) {
      return `${this.getFieldLabel(fieldName)} is required`;
    }
    if (control?.hasError('email')) {
      return 'Please enter a valid email address';
    }
    if (control?.hasError('minlength')) {
      const minLength = control.errors?.['minlength']?.requiredLength;
      return `Minimum ${minLength} characters required`;
    }
    if (control?.hasError('maxlength')) {
      const maxLength = control.errors?.['maxlength']?.requiredLength;
      return `Maximum ${maxLength} characters allowed`;
    }
    if (control?.hasError('pattern')) {
      if (fieldName === 'username') {
        return 'Username can only contain letters, numbers, and underscores';
      }
      if (fieldName === 'phone') {
        return 'Please enter a valid phone number';
      }
    }
    if (control?.hasError('passwordMismatch')) {
      return 'Passwords do not match';
    }
    if (control?.hasError('min')) {
      const min = control.errors?.['min']?.min;
      return `Minimum value is ${min}`;
    }
    if (control?.hasError('max')) {
      const max = control.errors?.['max']?.max;
      return `Maximum value is ${max}`;
    }
    return '';
  }

  private getFieldLabel(fieldName: string): string {
    const labels: { [key: string]: string } = {
      username: 'Username',
      password: 'Password',
      confirmPassword: 'Confirm Password',
      firstName: 'First Name',
      lastName: 'Last Name',
      email: 'Email',
      phone: 'Phone',
      location: 'Location',
      companyName: 'Company Name',
      companySize: 'Company Size',
      establishedYear: 'Established Year',
      website: 'Website',
      companyDescription: 'Company Description',
      specialization: 'Specialization',
      experienceLevel: 'Experience Level',
      hourlyRate: 'Hourly Rate',
      availableHours: 'Available Hours',
      skills: 'Skills',
      industry: 'Industry',
      companyType: 'Company Type',
      projectBudgetRange: 'Project Budget Range',
      preferredProjectDuration: 'Preferred Project Duration',
      terms: 'Terms and Conditions'
    };
    return labels[fieldName] || fieldName;
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.registerForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getProgressPercentage(): number {
    return (this.currentStep / this.totalSteps) * 100;
  }

  getRoleDisplayName(): string {
    const role = this.userRoles.find(r => r.id === this.selectedRole);
    return role ? role.name : '';
  }
}