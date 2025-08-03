export interface Application {
  id: string;
  projectId: string;
  talentId: string;
  talentType: 'freelancer' | 'service_company';
  talentName: string;
  talentAvatar?: string;
  talentRating: number;
  talentReviews: number;
  coverLetter: string;
  proposedBudget?: number;
  proposedTimeline?: string;
  portfolioItems?: PortfolioItem[];
  attachments?: ApplicationAttachment[];
  status: 'pending' | 'reviewed' | 'shortlisted' | 'rejected' | 'offered' | 'hired';
  submittedDate: Date;
  reviewedDate?: Date;
  
  // Service Company specific
  companyName?: string;
  teamSize?: number;
  availableEngineers?: Engineer[];
  
  // Freelancer specific
  specialization?: string;
  experienceLevel?: string;
  hourlyRate?: number;
  skills?: string[];
}

export interface Engineer {
  id: string;
  name: string;
  specialization: string;
  experienceLevel: string;
  skills: string[];
  hourlyRate?: number;
  avatar?: string;
}

export interface ApplicationAttachment {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
}

export interface PortfolioItem {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
  projectUrl?: string;
  technologies: string[];
}

export interface Offer {
  id: string;
  projectId: string;
  applicationId: string;
  clientId: string;
  talentId: string;
  title: string;
  description: string;
  budget: {
    amount: number;
    type: 'fixed' | 'hourly';
    currency: 'EUR';
  };
  timeline: string;
  startDate?: Date;
  milestones?: Milestone[];
  terms: string;
  status: 'sent' | 'accepted' | 'declined' | 'expired';
  sentDate: Date;
  responseDate?: Date;
  expiryDate: Date;
}

export interface Milestone {
  id: string;
  title: string;
  description: string;
  amount: number;
  dueDate: Date;
}