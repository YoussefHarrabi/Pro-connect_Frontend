export interface Project {
  id: string;
  title: string;
  description: string;
  clientId: string;
  clientName: string;
  clientAvatar?: string;
  clientRating: number;
  clientReviews: number;
  category: ProjectCategory;
  subcategory?: string;
  skills: string[];
  budget: ProjectBudget;
  timeline: ProjectTimeline;
  complexity: 'entry' | 'intermediate' | 'expert';
  attachments?: ProjectAttachment[];
  proposals: number;
  status: ProjectStatus;
  postedDate: Date;
  deadline?: Date;
  location?: string;
  isRemote: boolean;
  isUrgent: boolean;
  isFeatured: boolean;
  projectType: 'fixed' | 'hourly';
  estimatedHours?: number;
  milestones?: ProjectMilestone[];
  preferredTalentType: 'freelancer' | 'agency' | 'both';
  experienceLevel: 'entry' | 'intermediate' | 'expert';
  languages?: string[];
  tags?: string[];
}

export interface ProjectBudget {
  type: 'fixed' | 'hourly';
  min?: number;
  max?: number;
  currency: 'EUR';
  isNegotiable: boolean;
}

export interface ProjectTimeline {
  duration: string;
  startDate?: Date;
  isFlexible: boolean;
}

export interface ProjectAttachment {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
}

export interface ProjectMilestone {
  id: string;
  title: string;
  description: string;
  amount: number;
  dueDate?: Date;
}

export type ProjectCategory = 
  | 'web-development'
  | 'mobile-development'
  | 'design'
  | 'data-science'
  | 'devops'
  | 'ai-ml'
  | 'blockchain'
  | 'qa-testing'
  | 'project-management'
  | 'other';

export type ProjectStatus = 
  | 'draft'
  | 'open'
  | 'in-progress'
  | 'completed'
  | 'cancelled'
  | 'paused';

export interface ProjectFilters {
  keyword?: string;
  category?: ProjectCategory;
  skills?: string[];
  budgetMin?: number;
  budgetMax?: number;
  projectType?: 'fixed' | 'hourly';
  timeline?: string;
  complexity?: string;
  isRemote?: boolean;
  postedWithin?: 'day' | 'week' | 'month';
}

export interface Proposal {
  id: string;
  projectId: string;
  freelancerId: string;
  freelancerName: string;
  freelancerAvatar?: string;
  freelancerRating: number;
  coverLetter: string;
  proposedBudget: number;
  timeline: string;
  attachments?: ProjectAttachment[];
  submittedDate: Date;
  status: 'pending' | 'accepted' | 'rejected';
}