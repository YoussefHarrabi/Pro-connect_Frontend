import { Injectable } from '@angular/core';
import { Observable, of, BehaviorSubject, delay } from 'rxjs';
import { Project, ProjectFilters, Proposal, ProjectCategory } from '../models/project';

@Injectable({
  providedIn: 'root'
})
export class ProjectMarketplaceService {
  private savedProjectsSubject = new BehaviorSubject<string[]>([]);
  public savedProjects$ = this.savedProjectsSubject.asObservable();

  // Mock data initialized immediately
  private mockProjects: Project[] = [
    {
      id: '1',
      title: 'E-commerce Website Development with React & Node.js',
      description: 'We need a modern e-commerce website built with React frontend and Node.js backend. The project includes user authentication, product catalog, shopping cart, payment integration (Stripe), and admin dashboard. We prefer modern UI/UX design with responsive layout. The website should support multiple payment methods, inventory management, order tracking, and customer reviews.',
      clientId: 'client1',
      clientName: 'TechCorp Solutions',
      clientAvatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=50&h=50&fit=crop&crop=face',
      clientRating: 4.8,
      clientReviews: 23,
      category: 'web-development',
      subcategory: 'Full-Stack Development',
      skills: ['React', 'Node.js', 'MongoDB', 'Express', 'Stripe API', 'CSS3', 'JavaScript', 'TypeScript'],
      budget: {
        type: 'fixed',
        min: 3000,
        max: 5000,
        currency: 'EUR',
        isNegotiable: true
      },
      timeline: {
        duration: '6-8 weeks',
        startDate: new Date('2025-01-15'),
        isFlexible: false
      },
      complexity: 'intermediate',
      proposals: 12,
      status: 'open',
      postedDate: new Date('2025-01-01'),
      deadline: new Date('2025-01-31'),
      isRemote: true,
      isUrgent: false,
      isFeatured: true,
      projectType: 'fixed',
      estimatedHours: 200,
      preferredTalentType: 'both',
      experienceLevel: 'intermediate',
      languages: ['English', 'French'],
      tags: ['urgent', 'long-term-potential']
    },
    {
      id: '2',
      title: 'Mobile App UI/UX Design for Fitness Tracking',
      description: 'Looking for a talented UI/UX designer to create modern, intuitive designs for our fitness tracking mobile app. Need complete user flow, wireframes, and high-fidelity mockups for both iOS and Android platforms. The app should have features for workout tracking, nutrition logging, progress visualization, social features, and gamification elements.',
      clientId: 'client2',
      clientName: 'FitLife Startup',
      clientAvatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=50&h=50&fit=crop&crop=face',
      clientRating: 4.5,
      clientReviews: 8,
      category: 'design',
      subcategory: 'Mobile App Design',
      skills: ['Figma', 'UI/UX Design', 'Mobile Design', 'Prototyping', 'User Research', 'Adobe XD'],
      budget: {
        type: 'fixed',
        min: 1500,
        max: 2500,
        currency: 'EUR',
        isNegotiable: false
      },
      timeline: {
        duration: '3-4 weeks',
        isFlexible: true
      },
      complexity: 'intermediate',
      proposals: 18,
      status: 'open',
      postedDate: new Date('2024-12-28'),
      isRemote: true,
      isUrgent: true,
      isFeatured: false,
      projectType: 'fixed',
      preferredTalentType: 'freelancer',
      experienceLevel: 'intermediate',
      languages: ['English']
    },
    {
      id: '3',
      title: 'Data Analysis & Machine Learning Model Development',
      description: 'We have a large dataset of customer behavior and need someone to build predictive models to improve our marketing campaigns. Experience with Python, pandas, scikit-learn, and data visualization is required. The project involves data cleaning, exploratory data analysis, feature engineering, model development, and creating visualization dashboards.',
      clientId: 'client3',
      clientName: 'DataDriven Marketing',
      clientAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=50&h=50&fit=crop&crop=face',
      clientRating: 4.9,
      clientReviews: 31,
      category: 'data-science',
      skills: ['Python', 'Machine Learning', 'Pandas', 'Scikit-learn', 'Data Visualization', 'SQL', 'TensorFlow', 'Jupyter'],
      budget: {
        type: 'hourly',
        min: 40,
        max: 60,
        currency: 'EUR',
        isNegotiable: true
      },
      timeline: {
        duration: '4-6 weeks',
        isFlexible: true
      },
      complexity: 'expert',
      proposals: 7,
      status: 'open',
      postedDate: new Date('2024-12-30'),
      isRemote: true,
      isUrgent: false,
      isFeatured: false,
      projectType: 'hourly',
      estimatedHours: 120,
      preferredTalentType: 'freelancer',
      experienceLevel: 'expert',
      languages: ['English']
    },
    {
      id: '4',
      title: 'WordPress Website Redesign with Custom Theme',
      description: 'Need to redesign our existing WordPress website with a modern, professional look. The site should be mobile-responsive, fast-loading, and SEO-optimized. We need a custom theme development, content migration, and integration with social media platforms. The website is for a consulting firm and should convey trust and professionalism.',
      clientId: 'client4',
      clientName: 'Professional Consulting Group',
      clientAvatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b586?w=50&h=50&fit=crop&crop=face',
      clientRating: 4.6,
      clientReviews: 15,
      category: 'web-development',
      subcategory: 'WordPress Development',
      skills: ['WordPress', 'PHP', 'CSS3', 'HTML5', 'JavaScript', 'SEO', 'Responsive Design'],
      budget: {
        type: 'fixed',
        min: 800,
        max: 1500,
        currency: 'EUR',
        isNegotiable: true
      },
      timeline: {
        duration: '2-3 weeks',
        isFlexible: false
      },
      complexity: 'entry',
      proposals: 25,
      status: 'open',
      postedDate: new Date('2024-12-25'),
      isRemote: true,
      isUrgent: false,
      isFeatured: false,
      projectType: 'fixed',
      preferredTalentType: 'freelancer',
      experienceLevel: 'entry',
      languages: ['English', 'French']
    },
    {
      id: '5',
      title: 'iOS and Android App Development - Food Delivery',
      description: 'Looking for experienced mobile developers to create a food delivery app similar to UberEats. The app needs customer app, restaurant app, and delivery driver app. Features include real-time tracking, payment integration, push notifications, rating system, and admin panel. Backend API development is also required.',
      clientId: 'client5',
      clientName: 'QuickBite Ventures',
      clientAvatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=50&h=50&fit=crop&crop=face',
      clientRating: 4.7,
      clientReviews: 12,
      category: 'mobile-development',
      skills: ['React Native', 'Flutter', 'iOS Development', 'Android Development', 'Firebase', 'API Development', 'Payment Integration'],
      budget: {
        type: 'fixed',
        min: 8000,
        max: 15000,
        currency: 'EUR',
        isNegotiable: true
      },
      timeline: {
        duration: '3-4 months',
        isFlexible: true
      },
      complexity: 'expert',
      proposals: 9,
      status: 'open',
      postedDate: new Date('2024-12-20'),
      deadline: new Date('2025-02-15'),
      isRemote: true,
      isUrgent: true,
      isFeatured: true,
      projectType: 'fixed',
      preferredTalentType: 'agency',
      experienceLevel: 'expert',
      languages: ['English']
    },
    {
      id: '6',
      title: 'DevOps and AWS Infrastructure Setup',
      description: 'Need a DevOps engineer to set up scalable AWS infrastructure for our web applications. Requirements include CI/CD pipeline setup, Docker containerization, Kubernetes orchestration, monitoring setup, and security best practices implementation. Experience with Terraform for infrastructure as code is preferred.',
      clientId: 'client6',
      clientName: 'CloudTech Solutions',
      clientAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=50&h=50&fit=crop&crop=face',
      clientRating: 4.8,
      clientReviews: 19,
      category: 'devops',
      skills: ['AWS', 'Docker', 'Kubernetes', 'Terraform', 'Jenkins', 'CI/CD', 'Linux', 'Monitoring'],
      budget: {
        type: 'hourly',
        min: 50,
        max: 80,
        currency: 'EUR',
        isNegotiable: false
      },
      timeline: {
        duration: '4-6 weeks',
        isFlexible: true
      },
      complexity: 'expert',
      proposals: 14,
      status: 'open',
      postedDate: new Date('2024-12-18'),
      isRemote: true,
      isUrgent: false,
      isFeatured: false,
      projectType: 'hourly',
      estimatedHours: 160,
      preferredTalentType: 'freelancer',
      experienceLevel: 'expert',
      languages: ['English']
    }
  ];

  constructor() {
    this.loadSavedProjects();
    console.log('ProjectMarketplaceService initialized with', this.mockProjects.length, 'projects');
  }

  searchProjects(filters: ProjectFilters): Observable<Project[]> {
    console.log('searchProjects called with filters:', filters);
    
    // Start with all projects
    let filteredProjects = [...this.mockProjects];
    console.log('Starting with', filteredProjects.length, 'projects');

    // Only apply filters if they have actual values
    if (filters.keyword && filters.keyword.trim() !== '') {
      const keyword = filters.keyword.toLowerCase().trim();
      filteredProjects = filteredProjects.filter(project =>
        project.title.toLowerCase().includes(keyword) ||
        project.description.toLowerCase().includes(keyword) ||
        project.skills.some(skill => skill.toLowerCase().includes(keyword)) ||
        project.clientName.toLowerCase().includes(keyword)
      );
      console.log('After keyword filter:', filteredProjects.length, 'projects');
    }

    if (filters.category) {
      filteredProjects = filteredProjects.filter(project => project.category === filters.category);
      console.log('After category filter:', filteredProjects.length, 'projects');
    }

    if (filters.skills && Array.isArray(filters.skills) && filters.skills.length > 0) {
      filteredProjects = filteredProjects.filter(project =>
        filters.skills!.some(skill => 
          project.skills.some(projectSkill => 
            projectSkill.toLowerCase().includes(skill.toLowerCase())
          )
        )
      );
      console.log('After skills filter:', filteredProjects.length, 'projects');
    }

    if (filters.budgetMin && filters.budgetMin > 0) {
      filteredProjects = filteredProjects.filter(project => {
        const projectBudget = project.budget.max || project.budget.min || 0;
        return projectBudget >= filters.budgetMin!;
      });
      console.log('After budgetMin filter:', filteredProjects.length, 'projects');
    }

    if (filters.budgetMax && filters.budgetMax > 0) {
      filteredProjects = filteredProjects.filter(project => {
        const projectBudget = project.budget.min || project.budget.max || 0;
        return projectBudget <= filters.budgetMax!;
      });
      console.log('After budgetMax filter:', filteredProjects.length, 'projects');
    }

    if (filters.projectType) {
      filteredProjects = filteredProjects.filter(project => project.projectType === filters.projectType);
      console.log('After projectType filter:', filteredProjects.length, 'projects');
    }

    if (filters.complexity && filters.complexity !== '') {
      filteredProjects = filteredProjects.filter(project => project.complexity === filters.complexity);
      console.log('After complexity filter:', filteredProjects.length, 'projects');
    }

    if (filters.isRemote === true) {
      filteredProjects = filteredProjects.filter(project => project.isRemote === true);
      console.log('After remote filter:', filteredProjects.length, 'projects');
    }

    console.log('Final filtered projects:', filteredProjects.length);
    return of(filteredProjects).pipe(delay(100));
  }

  getAllProjects(): Observable<Project[]> {
    return of([...this.mockProjects]).pipe(delay(100));
  }

  getAvailableSkills(): string[] {
    return [
      'React', 'Vue.js', 'Angular', 'Node.js', 'Python', 'Django', 'Flask',
      'JavaScript', 'TypeScript', 'HTML5', 'CSS3', 'SASS', 'Bootstrap', 'Tailwind',
      'MongoDB', 'PostgreSQL', 'MySQL', 'Redis', 'AWS', 'Docker', 'Kubernetes',
      'GraphQL', 'REST API', 'Microservices', 'DevOps', 'CI/CD', 'Jenkins',
      'Figma', 'Adobe XD', 'Sketch', 'UI/UX Design', 'Prototyping', 'User Research',
      'Machine Learning', 'Data Science', 'TensorFlow', 'PyTorch', 'Pandas', 'Jupyter',
      'Blockchain', 'Smart Contracts', 'Web3', 'Solidity', 'Ethereum',
      'Mobile Development', 'React Native', 'Flutter', 'Swift', 'Kotlin',
      'WordPress', 'PHP', 'Laravel', 'SEO', 'Performance Optimization',
      'Manual Testing', 'Automation Testing', 'Selenium', 'Jest', 'Security Testing'
    ];
  }

  getProjectCategories(): { value: ProjectCategory; label: string; icon: string }[] {
    return [
      { value: 'web-development', label: 'Web Development', icon: '🌐' },
      { value: 'mobile-development', label: 'Mobile Development', icon: '📱' },
      { value: 'design', label: 'Design & Creative', icon: '🎨' },
      { value: 'data-science', label: 'Data Science & ML', icon: '📊' },
      { value: 'devops', label: 'DevOps & Cloud', icon: '☁️' },
      { value: 'ai-ml', label: 'AI & Machine Learning', icon: '🤖' },
      { value: 'blockchain', label: 'Blockchain', icon: '⛓️' },
      { value: 'qa-testing', label: 'QA & Testing', icon: '🧪' },
      { value: 'project-management', label: 'Project Management', icon: '📋' },
      { value: 'other', label: 'Other', icon: '📦' }
    ];
  }

  createProject(project: Partial<Project>): Observable<Project> {
    const newProject: Project = {
      id: Date.now().toString(),
      status: 'open',
      proposals: 0,
      postedDate: new Date(),
      isRemote: true,
      isUrgent: false,
      isFeatured: false,
      ...project
    } as Project;

    this.mockProjects.unshift(newProject);
    return of(newProject).pipe(delay(500));
  }

  // Saved projects functionality
  saveProject(projectId: string): void {
    const saved = this.savedProjectsSubject.value;
    if (!saved.includes(projectId)) {
      const updated = [...saved, projectId];
      this.savedProjectsSubject.next(updated);
      localStorage.setItem('savedProjects', JSON.stringify(updated));
    }
  }

  removeSavedProject(projectId: string): void {
    const saved = this.savedProjectsSubject.value;
    const updated = saved.filter(id => id !== projectId);
    this.savedProjectsSubject.next(updated);
    localStorage.setItem('savedProjects', JSON.stringify(updated));
  }

  isProjectSaved(projectId: string): boolean {
    return this.savedProjectsSubject.value.includes(projectId);
  }

  private loadSavedProjects(): void {
    const saved = localStorage.getItem('savedProjects');
    if (saved) {
      try {
        this.savedProjectsSubject.next(JSON.parse(saved));
      } catch (e) {
        this.savedProjectsSubject.next([]);
      }
    }
  }

  getSavedProjects(): Observable<Project[]> {
    const savedIds = this.savedProjectsSubject.value;
    const savedProjects = this.mockProjects.filter(project => savedIds.includes(project.id));
    return of(savedProjects).pipe(delay(100));
  }
}