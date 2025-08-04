import { Injectable } from '@angular/core';
import { Observable, of, BehaviorSubject, delay } from 'rxjs';
import { Application, Offer } from '../models/application';

@Injectable({
  providedIn: 'root'
})
export class ApplicationService {
  private applicationsSubject = new BehaviorSubject<Application[]>([]);
  public applications$ = this.applicationsSubject.asObservable();

  private offersSubject = new BehaviorSubject<Offer[]>([]);
  public offers$ = this.offersSubject.asObservable();

  // Mock applications data
  private mockApplications: Application[] = [
    {
      id: '1',
      projectId: '1',
      talentId: 'talent1',
      talentType: 'freelancer',
      talentName: 'Alex Johnson',
      talentAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=60&h=60&fit=crop&crop=face',
      talentRating: 4.8,
      talentReviews: 42,
      coverLetter: 'I am excited to work on your e-commerce project. With 5+ years of experience in React and Node.js, I can deliver a high-quality solution within your timeline. I have successfully built similar platforms for clients in the past.',
      proposedBudget: 4500,
      proposedTimeline: '7 weeks',
      status: 'pending',
      submittedDate: new Date('2025-01-02'),
      specialization: 'Full-Stack Development',
      experienceLevel: 'senior',
      hourlyRate: 65,
      skills: ['React', 'Node.js', 'MongoDB', 'TypeScript', 'AWS']
    },
    {
      id: '2',
      projectId: '1',
      talentId: 'company1',
      talentType: 'service_company',
      talentName: 'TechSolutions Pro',
      talentAvatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=60&h=60&fit=crop&crop=face',
      talentRating: 4.9,
      talentReviews: 28,
      coverLetter: 'Our experienced team of 15 engineers specializes in e-commerce solutions. We can assign 3 dedicated developers to your project, ensuring faster delivery and round-the-clock support. We have delivered 50+ similar projects.',
      proposedBudget: 4000,
      proposedTimeline: '5 weeks',
      status: 'pending',
      submittedDate: new Date('2025-01-01'),
      companyName: 'TechSolutions Pro',
      teamSize: 15,
      availableEngineers: [
        {
          id: 'eng1',
          name: 'Sarah Chen',
          specialization: 'Frontend Development',
          experienceLevel: 'senior',
          skills: ['React', 'Vue.js', 'TypeScript', 'CSS3'],
          hourlyRate: 55,
          avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b586?w=40&h=40&fit=crop&crop=face'
        },
        {
          id: 'eng2',
          name: 'Michael Rodriguez',
          specialization: 'Backend Development',
          experienceLevel: 'senior',
          skills: ['Node.js', 'Python', 'MongoDB', 'AWS'],
          hourlyRate: 60,
          avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face'
        },
        {
          id: 'eng3',
          name: 'Emma Wilson',
          specialization: 'DevOps',
          experienceLevel: 'intermediate',
          skills: ['Docker', 'Kubernetes', 'CI/CD', 'AWS'],
          hourlyRate: 50,
          avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=40&h=40&fit=crop&crop=face'
        }
      ]
    },
    {
      id: '3',
      projectId: '2',
      talentId: 'talent2',
      talentType: 'freelancer',
      talentName: 'Maria Garcia',
      talentAvatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b586?w=60&h=60&fit=crop&crop=face',
      talentRating: 4.7,
      talentReviews: 35,
      coverLetter: 'As a UI/UX designer with extensive experience in fitness app design, I understand the importance of creating motivational and user-friendly interfaces. I will provide wireframes, prototypes, and high-fidelity designs.',
      proposedBudget: 2200,
      proposedTimeline: '4 weeks',
      status: 'pending',
      submittedDate: new Date('2025-01-03'),
      specialization: 'UI/UX Design',
      experienceLevel: 'intermediate',
      skills: ['Figma', 'Adobe XD', 'Prototyping', 'User Research', 'Mobile Design']
    }
  ];

  private mockOffers: Offer[] = [];

  constructor() {
    this.applicationsSubject.next(this.mockApplications);
    this.offersSubject.next(this.mockOffers);
  }

  getApplicationsByProject(projectId: string): Observable<Application[]> {
    const projectApplications = this.mockApplications.filter(app => app.projectId === projectId);
    return of(projectApplications).pipe(delay(300));
  }

  getAllApplications(): Observable<Application[]> {
    return of([...this.mockApplications]).pipe(delay(300));
  }

  updateApplicationStatus(applicationId: string, status: Application['status']): Observable<Application> {
    const application = this.mockApplications.find(app => app.id === applicationId);
    if (application) {
      application.status = status;
      application.reviewedDate = new Date();
      this.applicationsSubject.next([...this.mockApplications]);
    }
    return of(application!).pipe(delay(200));
  }

  createOffer(offer: Partial<Offer>): Observable<Offer> {
    const newOffer: Offer = {
      id: Date.now().toString(),
      status: 'sent',
      sentDate: new Date(),
      expiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      ...offer
    } as Offer;

    this.mockOffers.push(newOffer);
    this.offersSubject.next([...this.mockOffers]);
    
    // Update application status to 'offered'
    this.updateApplicationStatus(offer.applicationId!, 'offered').subscribe();
    
    return of(newOffer).pipe(delay(500));
  }

  getOffersByClient(clientId: string): Observable<Offer[]> {
    const clientOffers = this.mockOffers.filter(offer => offer.clientId === clientId);
    return of(clientOffers).pipe(delay(300));
  }

  respondToOffer(offerId: string, response: 'accepted' | 'declined'): Observable<Offer> {
    const offer = this.mockOffers.find(o => o.id === offerId);
    if (offer) {
      offer.status = response;
      offer.responseDate = new Date();
      this.offersSubject.next([...this.mockOffers]);
    }
    return of(offer!).pipe(delay(200));
  }

  submitApplication(application: Partial<Application>): Observable<Application> {
    const newApplication: Application = {
      id: Date.now().toString(),
      status: 'pending',
      submittedDate: new Date(),
      ...application
    } as Application;

    this.mockApplications.push(newApplication);
    this.applicationsSubject.next([...this.mockApplications]);
    
    return of(newApplication).pipe(delay(500));
  }
}