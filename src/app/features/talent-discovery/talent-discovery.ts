import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface TalentProfile {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  talentType: 'freelancer' | 'service_company';
  avatar?: string;
  title: string;
  bio: string;
  skills: string[];
  location: string;
  hourlyRate?: number;
  availability: 'available' | 'busy' | 'unavailable';
  rating: number;
  totalReviews: number;
  isVerified: boolean;
  joinedDate: Date;
  lastActive: Date;
  portfolioCount: number;
  completedProjects: number;
  responseTime: string;
  languages: string[];
  // Service Company specific
  companyName?: string;
  teamSize?: number;
}

export interface SearchFilters {
  keyword: string;
  talentTypes: string[];
  skills: string[];
  availability: string[];
  minRating: number;
  verifiedOnly: boolean;
  minHourlyRate?: number;
  maxHourlyRate?: number;
  location?: string;
}

@Injectable({
  providedIn: 'root'
})
export class TalentDiscoveryService {
  private shortlistSubject = new BehaviorSubject<string[]>([]);
  public shortlist$ = this.shortlistSubject.asObservable();

  // Mock talent data
  private mockTalents: TalentProfile[] = [
    {
      id: '1',
      username: 'react_dev_pro',
      firstName: 'Sarah',
      lastName: 'Johnson',
      talentType: 'freelancer',
      avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b586?w=150&h=150&fit=crop&crop=face',
      title: 'Senior React Developer',
      bio: 'Experienced frontend developer specializing in React, TypeScript, and modern web technologies.',
      skills: ['React', 'TypeScript', 'Node.js', 'GraphQL', 'AWS'],
      location: 'Remote',
      hourlyRate: 75,
      availability: 'available',
      rating: 4.9,
      totalReviews: 124,
      isVerified: true,
      joinedDate: new Date('2021-03-15'),
      lastActive: new Date('2024-12-25'),
      portfolioCount: 8,
      completedProjects: 45,
      responseTime: '< 2 hours',
      languages: ['English', 'French']
    },
    {
      id: '2',
      username: 'full_stack_ninja',
      firstName: 'Michael',
      lastName: 'Chen',
      talentType: 'freelancer',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
      title: 'Full-Stack Developer',
      bio: 'Full-stack developer with expertise in Python, Django, React, and cloud technologies.',
      skills: ['Python', 'Django', 'React', 'PostgreSQL', 'Docker', 'Kubernetes'],
      location: 'New York, USA',
      hourlyRate: 85,
      availability: 'busy',
      rating: 4.8,
      totalReviews: 89,
      isVerified: true,
      joinedDate: new Date('2020-08-20'),
      lastActive: new Date('2024-12-24'),
      portfolioCount: 12,
      completedProjects: 67,
      responseTime: '< 4 hours',
      languages: ['English', 'Mandarin']
    },
    {
      id: '3',
      username: 'ui_ux_master',
      firstName: 'Emma',
      lastName: 'Wilson',
      talentType: 'freelancer',
      title: 'UI/UX Designer & Frontend Developer',
      bio: 'Creative designer and developer focused on user experience and modern web interfaces.',
      skills: ['Figma', 'React', 'Vue.js', 'CSS', 'JavaScript', 'Design Systems'],
      location: 'London, UK',
      hourlyRate: 65,
      availability: 'available',
      rating: 4.7,
      totalReviews: 76,
      isVerified: false,
      joinedDate: new Date('2022-01-10'),
      lastActive: new Date('2024-12-26'),
      portfolioCount: 15,
      completedProjects: 32,
      responseTime: '< 6 hours',
      languages: ['English', 'Spanish']
    },
    {
      id: '4',
      username: 'tech_solutions_inc',
      firstName: 'David',
      lastName: 'Brown',
      talentType: 'service_company',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
      title: 'CTO',
      bio: 'Leading a team of 15+ developers specializing in enterprise web applications and mobile solutions.',
      skills: ['Team Management', 'React', 'Node.js', 'AWS', 'Microservices', 'DevOps'],
      location: 'San Francisco, USA',
      availability: 'available',
      rating: 4.9,
      totalReviews: 156,
      isVerified: true,
      joinedDate: new Date('2019-05-12'),
      lastActive: new Date('2024-12-25'),
      portfolioCount: 25,
      completedProjects: 120,
      responseTime: '< 1 hour',
      languages: ['English'],
      companyName: 'Tech Solutions Inc',
      teamSize: 15
    },
    {
      id: '5',
      username: 'mobile_dev_expert',
      firstName: 'Lisa',
      lastName: 'Garcia',
      talentType: 'freelancer',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
      title: 'Mobile App Developer',
      bio: 'Specialized in cross-platform mobile development using React Native and Flutter.',
      skills: ['React Native', 'Flutter', 'iOS', 'Android', 'Firebase', 'TypeScript'],
      location: 'Remote',
      hourlyRate: 70,
      availability: 'unavailable',
      rating: 4.6,
      totalReviews: 43,
      isVerified: true,
      joinedDate: new Date('2021-11-08'),
      lastActive: new Date('2024-12-23'),
      portfolioCount: 10,
      completedProjects: 28,
      responseTime: '< 8 hours',
      languages: ['English', 'Spanish']
    },
    {
      id: '6',
      username: 'ai_ml_specialist',
      firstName: 'Ahmed',
      lastName: 'Hassan',
      talentType: 'freelancer',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face',
      title: 'AI/ML Engineer',
      bio: 'Machine learning engineer with expertise in deep learning, computer vision, and NLP.',
      skills: ['Python', 'TensorFlow', 'PyTorch', 'Computer Vision', 'NLP', 'AWS SageMaker'],
      location: 'Dubai, UAE',
      hourlyRate: 95,
      availability: 'available',
      rating: 4.8,
      totalReviews: 67,
      isVerified: true,
      joinedDate: new Date('2020-02-14'),
      lastActive: new Date('2024-12-26'),
      portfolioCount: 6,
      completedProjects: 23,
      responseTime: '< 3 hours',
      languages: ['English', 'Arabic']
    }
  ];

  private availableSkills = [
    'React', 'Angular', 'Vue.js', 'TypeScript', 'JavaScript', 'Node.js', 'Python', 
    'Django', 'Flask', 'Java', 'Spring Boot', 'C#', '.NET', 'PHP', 'Laravel', 
    'Ruby', 'Rails', 'Go', 'Rust', 'PostgreSQL', 'MongoDB', 'MySQL', 'Redis', 
    'AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'GraphQL', 'REST API', 
    'Microservices', 'DevOps', 'CI/CD', 'Git', 'Figma', 'Design Systems', 
    'UI/UX', 'Mobile Development', 'React Native', 'Flutter', 'iOS', 'Android',
    'Machine Learning', 'AI', 'Data Science', 'TensorFlow', 'PyTorch', 'Computer Vision'
  ];

  constructor() {}

  searchTalents(filters: SearchFilters): Observable<TalentProfile[]> {
    return new Observable(observer => {
      // Simulate API delay
      setTimeout(() => {
        let filteredTalents = [...this.mockTalents];

        // Filter by keyword
        if (filters.keyword.trim()) {
          const keyword = filters.keyword.toLowerCase();
          filteredTalents = filteredTalents.filter(talent => 
            talent.title.toLowerCase().includes(keyword) ||
            talent.bio.toLowerCase().includes(keyword) ||
            talent.skills.some(skill => skill.toLowerCase().includes(keyword)) ||
            talent.firstName.toLowerCase().includes(keyword) ||
            talent.lastName.toLowerCase().includes(keyword) ||
            talent.username.toLowerCase().includes(keyword)
          );
        }

        // Filter by talent types
        if (filters.talentTypes.length > 0) {
          filteredTalents = filteredTalents.filter(talent => 
            filters.talentTypes.includes(talent.talentType)
          );
        }

        // Filter by skills
        if (filters.skills.length > 0) {
          filteredTalents = filteredTalents.filter(talent => 
            filters.skills.some(skill => talent.skills.includes(skill))
          );
        }

        // Filter by availability
        if (filters.availability.length > 0) {
          filteredTalents = filteredTalents.filter(talent => 
            filters.availability.includes(talent.availability)
          );
        }

        // Filter by minimum rating
        if (filters.minRating > 0) {
          filteredTalents = filteredTalents.filter(talent => 
            talent.rating >= filters.minRating
          );
        }

        // Filter by verified only
        if (filters.verifiedOnly) {
          filteredTalents = filteredTalents.filter(talent => talent.isVerified);
        }

        // Filter by hourly rate range
        if (filters.minHourlyRate) {
          filteredTalents = filteredTalents.filter(talent => 
            talent.hourlyRate && talent.hourlyRate >= filters.minHourlyRate!
          );
        }

        if (filters.maxHourlyRate) {
          filteredTalents = filteredTalents.filter(talent => 
            talent.hourlyRate && talent.hourlyRate <= filters.maxHourlyRate!
          );
        }

        observer.next(filteredTalents);
        observer.complete();
      }, 300);
    });
  }

  getAvailableSkills(): string[] {
    return this.availableSkills;
  }

  addToShortlist(talentId: string): void {
    const currentShortlist = this.shortlistSubject.value;
    if (!currentShortlist.includes(talentId)) {
      this.shortlistSubject.next([...currentShortlist, talentId]);
    }
  }

  removeFromShortlist(talentId: string): void {
    const currentShortlist = this.shortlistSubject.value;
    this.shortlistSubject.next(currentShortlist.filter(id => id !== talentId));
  }

  isInShortlist(talentId: string): boolean {
    return this.shortlistSubject.value.includes(talentId);
  }

  getShortlist(): string[] {
    return this.shortlistSubject.value;
  }

  getShortlistedTalents(): Observable<TalentProfile[]> {
    return new Observable(observer => {
      const shortlistIds = this.shortlistSubject.value;
      const shortlistedTalents = this.mockTalents.filter(talent => 
        shortlistIds.includes(talent.id)
      );
      observer.next(shortlistedTalents);
      observer.complete();
    });
  }
}