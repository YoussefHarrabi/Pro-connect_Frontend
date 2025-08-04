import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: '/auth/login', pathMatch: 'full' },
  { 
    path: 'auth', 
    loadChildren: () => import('./features/auth/auth-module').then(m => m.AuthModule)
  },
  { 
    path: 'profile', 
    loadComponent: () => import('./features/profile/profile').then(c => c.Profile)
  },
  { 
    path: 'profile/:username', 
    loadComponent: () => import('./features/profile/profile').then(c => c.Profile)
  },
  { 
    path: 'talent-discovery', 
    loadComponent: () => import('./features/talent-discovery/talent-discovery/talent-discovery').then(c => c.TalentDiscovery),
  },
  { 
    path: 'project-posting', 
    loadComponent: () => import('./features/client/project-posting/project-posting').then(c => c.ProjectPosting)
  },
  { 
    path: 'project-discovery', 
    loadComponent: () => import('./features/freelancer/project-discovery/project-discovery').then(c => c.ProjectDiscovery)
  },
  { 
    path: 'project-offers', 
    loadComponent: () => import('./features/freelancer/project-offers/project-offers').then(c => c.ProjectOffers)
  },
  { 
    path: 'client-dashboard', 
    loadComponent: () => import('./features/client/client-dashboard/client-dashboard').then(c => c.ClientDashboard)
  },
  { 
    path: 'chatbot', 
    loadComponent: () => import('./features/chatbot/chatbot').then(c => c.Chatbot)
  },
  { 
    path: 'workspace/:id', 
    loadComponent: () => import('./features/workspace/workspace').then(c => c.WorkspaceComponent)
  },
  { path: 'login', redirectTo: '/auth/login' },
  { path: 'register', redirectTo: '/auth/register' },
  { path: '**', redirectTo: '/auth/login' }
];