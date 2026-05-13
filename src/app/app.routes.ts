import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'home',
    loadComponent: () => import('./home/home.page').then((m) => m.HomePage),
  },
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full',
  },
  {
    path: 'login',
    loadComponent: () => import('./auth/login/login.page').then( m => m.LoginPage)
  },
  {
    path: 'register',
    loadComponent: () => import('./auth/register/register.page').then( m => m.RegisterPage)
  },
  // Pagina Home para el usuario comun
  {
    path: 'paciente-home',
    loadComponent: () => import('./pages/paciente/home/home.page').then(m => m.InicioPage)
  },
  {
    path: 'perfil',
    loadComponent: () => import('./pages/paciente/perfil/perfil.page').then( m => m.PerfilPage)
  },
  {
    path: 'agendar',
    loadComponent: () => import('./pages/paciente/agendar/agendar.page').then( m => m.AgendarPage)
  },  {
    path: 'mis-horas',
    loadComponent: () => import('./pages/paciente/mis-horas/mis-horas.page').then( m => m.MisHorasPage)
  }

];