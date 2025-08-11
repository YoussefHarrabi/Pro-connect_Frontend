export interface UserProfileResponse {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  address: string;
  bio: string;
  profilePictureUrl: string;
  location: string;
  availability: AvailabilityStatus;
  averageRating: number;
  totalReviews: number;
  verificationStatus: VerificationStatus;
  verified: boolean;
  hourlyRate: number;
  lastActive: string;
  resumeFileName: string;
  resumeUrl: string;
  resumeUploadedDate: string;
  languages: string[];
  githubUrl: string;
  stackoverflowUrl: string;
  linkedinUrl: string;
  personalWebsiteUrl: string;
  roles: ERole[];
  skills: SkillDto[];
  portfolios: PortfolioDto[];
  reviews: ReviewDto[];
  education: EducationDto[];
  certifications: CertificationDto[];
  experience: ExperienceDto[];
  createdAt: string;
  updatedAt: string;
}

export interface ProfileUpdateRequest {
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  address?: string;
  bio?: string;
  profilePictureUrl?: string;
  location?: string;
  hourlyRate?: number;
  availability?: AvailabilityStatus;
  languages?: string;
  githubUrl?: string;
  stackoverflowUrl?: string;
  linkedinUrl?: string;
  personalWebsiteUrl?: string;
}

export interface ResumeUpdateRequest {
  fileName: string;
  resumeUrl: string;
}

export interface EducationDto {
  id: number;
  degree: string;
  institution: string;
  startYear: number;
  endYear: number;
  description: string;
  gpa: string;
}

export interface EducationRequest {
  degree: string;
  institution: string;
  startYear?: number;
  endYear?: number;
  description?: string;
  gpa?: string;
}

export interface CertificationDto {
  id: number;
  name: string;
  issuer: string;
  issueDate: string;
  expiryDate: string;
  credentialId: string;
  credentialUrl: string;
}

export interface CertificationRequest {
  name: string;
  issuer: string;
  issueDate?: string;
  expiryDate?: string;
  credentialId?: string;
  credentialUrl?: string;
}

export interface ExperienceDto {
  id: number;
  title: string;
  company: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  description: string;
}

export interface ExperienceRequest {
  title: string;
  company: string;
  startDate?: string;
  endDate?: string;
  isCurrent: boolean;
  description?: string;
}

export interface SkillDto {
  id: number;
  name: string;
  category: string;
}

export interface PortfolioDto {
  id: number;
  title: string;
  description: string;
  projectLink: string;
  coverImageUrl: string;
  technologies: string;
  projectType: string;
  userUsername: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReviewDto {
  id: number;
  projectId: number;
  reviewerUsername: string;
  revieweeUsername: string;
  rating: number;
  comment: string;
  createdAt: string;
  skillRating: number;
  communicationRating: number;
  professionalismRating: number;
  clarityRating: number;
}

export enum AvailabilityStatus {
  AVAILABLE = 'AVAILABLE',
  BUSY = 'BUSY',
  UNAVAILABLE = 'UNAVAILABLE'
}

export enum VerificationStatus {
  PENDING = 'PENDING',
  VERIFIED = 'VERIFIED',
  REJECTED = 'REJECTED'
}

export enum ERole {
  CLIENT = 'CLIENT',
  FREELANCER = 'FREELANCER',
  SERVICE_COMPANY = 'SERVICE_COMPANY',
  ADMIN = 'ADMIN'
}