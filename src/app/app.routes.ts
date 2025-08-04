import { Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';
import { RoleGuard } from './core/guards/role.guard';
import { GuestGuard } from './core/guards/guest.guard';

export const routes: Routes = [
  { 
    path: '', 
    redirectTo: '/auth/login', 
    pathMatch: 'full' 
  },
  { 
    path: 'auth', 
    loadChildren: () => import('./features/auth/auth-module').then(m => m.AuthModule),
    canActivate: [GuestGuard]
  },
  { 
    path: 'profile', 
    loadComponent: () => import('./features/profile/profile').then(c => c.Profile),
    canActivate: [AuthGuard]
  },
  { 
    path: 'profile/:username', 
    loadComponent: () => import('./features/profile/profile').then(c => c.Profile),
    canActivate: [AuthGuard]
  },
  { 
    path: 'talent-discovery', 
    loadComponent: () => import('./features/talent-discovery/talent-discovery/talent-discovery').then(c => c.TalentDiscovery),
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['ROLE_CLIENT', 'ROLE_SERVICE_COMPANY'] } // Both client and service company can access
  },
  { 
    path: 'project-posting', 
    loadComponent: () => import('./features/client/project-posting/project-posting').then(c => c.ProjectPosting),
    canActivate: [AuthGuard, RoleGuard],
    data: { role: 'ROLE_CLIENT' } // Only clients can post projects
  },
  { 
    path: 'project-discovery', 
    loadComponent: () => import('./features/freelancer/project-discovery/project-discovery').then(c => c.ProjectDiscovery),
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['ROLE_FREELANCER', 'ROLE_SERVICE_COMPANY'] } // Both freelancer and service company can access
  },
  { 
    path: 'project-offers', 
    loadComponent: () => import('./features/freelancer/project-offers/project-offers').then(c => c.ProjectOffers),
    canActivate: [AuthGuard, RoleGuard],
    data: { role: 'ROLE_FREELANCER' } // Only freelancers
  },
  { 
    path: 'client-dashboard', 
    loadComponent: () => import('./features/client/client-dashboard/client-dashboard').then(c => c.ClientDashboard),
    canActivate: [AuthGuard, RoleGuard],
    data: { role: 'ROLE_CLIENT' } // Only clients
  },
  { 
    path: 'chatbot', 
    loadComponent: () => import('./features/chatbot/chatbot').then(c => c.Chatbot),
    canActivate: [AuthGuard]
  },
  { 
    path: 'workspace/:id', 
    loadComponent: () => import('./features/workspace/workspace').then(c => c.WorkspaceComponent),
    canActivate: [AuthGuard]
  },
  { 
    path: 'login', 
    redirectTo: '/auth/login' 
  },
  { 
    path: 'register', 
    redirectTo: '/auth/register' 
  },
  { 
    path: '**', 
    redirectTo: '/auth/login'
  }
];