export interface User {
  id: number;
  username: string;
  email: string;
  role: string; // Single role instead of roles array
  firstName?: string;
  lastName?: string;
  phone?: string;
  location?: string;
  profilePicture?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface UserProfile {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  location: string;
  profilePicture?: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  
  // Role-specific data
  serviceCompany?: ServiceCompanyProfile;
  freelancer?: FreelancerProfile;
  client?: ClientProfile;
}

export interface ServiceCompanyProfile {
  companyName: string;
  companySize: string;
  establishedYear: number;
  website?: string;
  companyDescription: string;
  logoUrl?: string;
  verified: boolean;
}

export interface FreelancerProfile {
  specialization: string;
  experienceLevel: string;
  hourlyRate: number;
  availableHours: string;
  skills: string;
  portfolioUrl?: string;
  resumeUrl?: string;
  rating?: number;
  completedProjects?: number;
  verified: boolean;
}

export interface ClientProfile {
  industry: string;
  companyType: string;
  projectBudgetRange: string;
  preferredProjectDuration: string;
  companySize?: string;
  website?: string;
  description?: string;
  verified: boolean;
}

export interface UserRole {
  id: string;
  name: string;
  description: string;
  permissions: string[];
}

export interface UpdateUserProfileRequest {
  firstName?: string;
  lastName?: string;
  phone?: string;
  location?: string;
  profilePicture?: string;
}

export interface UpdateServiceCompanyRequest {
  companyName?: string;
  companySize?: string;
  establishedYear?: number;
  website?: string;
  companyDescription?: string;
  logoUrl?: string;
}

export interface UpdateFreelancerRequest {
  specialization?: string;
  experienceLevel?: string;
  hourlyRate?: number;
  availableHours?: string;
  skills?: string;
  portfolioUrl?: string;
  resumeUrl?: string;
}

export interface UpdateClientRequest {
  industry?: string;
  companyType?: string;
  projectBudgetRange?: string;
  preferredProjectDuration?: string;
  companySize?: string;
  website?: string;
  description?: string;
}
// Update these in your user.ts or dto files

export interface PortfolioDto {
  id: number;
  title: string;
  description: string;
  projectLink: string;
  coverImageUrl: string;
  technologies: string;
  projectType: ProjectType; // Use enum instead of string
  userUsername: string;
  createdAt: string;
  updatedAt: string;
}

export interface PortfolioRequest {
  title: string;
  description: string;
  projectLink?: string;
  coverImageUrl?: string;
  technologies?: string;
  projectType?: ProjectType; // Use enum instead of string
}

// Add the ProjectType enum to match your backend
// Update this in your user.ts or dto files
export enum ProjectType {
  OTHER = 'OTHER',
  FRONTEND = 'FRONTEND',
  MOBILE_APPLICATION = 'MOBILE_APPLICATION',
  WEB_APPLICATION = 'WEB_APPLICATION',
  FULLSTACK = 'FULLSTACK',
  DEVOPS = 'DEVOPS',
  API_BACKEND = 'API_BACKEND',
  DATABASE_DESIGN = 'DATABASE_DESIGN',
  DESKTOP_APPLICATION = 'DESKTOP_APPLICATION',
  UI_UX_DESIGN = 'UI_UX_DESIGN'
}

// Add this to your user models file (src/app/shared/models/user.ts)
export interface SkillDto {
  id: number;
  name: string;
  category: string;
}