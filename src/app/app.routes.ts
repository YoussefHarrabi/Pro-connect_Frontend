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
    path: 'talent-discovery', 
    loadComponent: () => import('./features/talent-discovery/talent-discovery/talent-discovery').then(c => c.TalentDiscovery),
  },
  { path: 'login', redirectTo: '/auth/login' },
  { path: 'register', redirectTo: '/auth/register' },
  { path: '**', redirectTo: '/auth/login' }
];