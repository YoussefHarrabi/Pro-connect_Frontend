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
    path: 'freelancer-dashboard', 
    loadComponent: () => import('./features/freelancer/freelancer-dashboard/freelancer-dashboard').then(c => c.FreelancerDashboard),
    canActivate: [AuthGuard, RoleGuard],
    data: { role: 'ROLE_FREELANCER' } // Only freelancers
  },
  { 
    path: 'company-dashboard', 
    loadComponent: () => import('./features/service-company/company-dashboard/company-dashboard').then(c => c.CompanyDashboard),
    canActivate: [AuthGuard, RoleGuard],
    data: { role: 'ROLE_SERVICE_COMPANY' } // Only service companies
  },
  { 
    path: 'chatbot', 
    loadComponent: () => import('./features/chatbot/chatbot').then(c => c.Chatbot),
    canActivate: [AuthGuard]
  },
  { 
    path: 'workspace/:id', 
    loadComponent: () => import('./features/workspace/workspace').then(c => c.WorkspaceComponent),
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['ROLE_CLIENT', 'ROLE_FREELANCER', 'ROLE_SERVICE_COMPANY'] } // All roles can access workspace
  },
  { 
    path: 'admin-dashboard', 
    loadComponent: () => import('./features/admin/admin-dashboard/admin-dashboard').then(c => c.AdminDashboard),
    canActivate: [AuthGuard, RoleGuard],
    data: { role: 'ROLE_ADMIN' } // Only admins
  },
  { 
    path: 'admin-dashboard-dev', 
    loadComponent: () => import('./features/admin/admin-dashboard/admin-dashboard').then(c => c.AdminDashboard),
    canActivate: [AuthGuard] // Temporary dev access - remove in production
  },
  { 
    path: 'admin/users', 
    loadComponent: () => import('./features/admin/user-management/user-management').then(c => c.UserManagement),
    canActivate: [AuthGuard, RoleGuard],
    data: { role: 'ROLE_ADMIN' } // Only admins
  },
  { 
    path: 'admin/users-dev', 
    loadComponent: () => import('./features/admin/user-management/user-management').then(c => c.UserManagement),
    canActivate: [AuthGuard] // Temporary dev access - remove in production
  },
  { 
    path: 'admin/projects', 
    loadComponent: () => import('./features/admin/project-management/project-management').then(c => c.ProjectManagement),
    canActivate: [AuthGuard, RoleGuard],
    data: { role: 'ROLE_ADMIN' } // Only admins
  },
  { 
    path: 'admin/projects-dev', 
    loadComponent: () => import('./features/admin/project-management/project-management').then(c => c.ProjectManagement),
    canActivate: [AuthGuard] // Temporary dev access - remove in production
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