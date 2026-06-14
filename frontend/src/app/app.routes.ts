import { Routes } from '@angular/router';
import { adminGuard } from './guards/admin-guard';

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
    canActivate:[adminGuard],
    loadComponent: () => import('./pages/paciente/home/home.page').then(m => m.InicioPage)
  },
  {
    path: 'perfil',
    canActivate:[adminGuard],
    loadComponent: () => import('./pages/paciente/perfil/perfil.page').then( m => m.PerfilPage)
  },
  {
    path: 'agendar',
    canActivate:[adminGuard],
    loadComponent: () => import('./pages/paciente/agendar/agendar.page').then( m => m.AgendarPage)
  },
  {
    path: 'mis-horas',
    canActivate:[adminGuard],
    loadComponent: () => import('./pages/paciente/mis-horas/mis-horas.page').then( m => m.MisHorasPage)
  },
  {
    path: 'control-medico',
    canActivate:[adminGuard],
    loadComponent: () => import('./pages/paciente/control-medico/control-medico.page').then( m => m.ControlMedicoPage)
  },
  {
    path: 'psicologo',
    canActivate:[adminGuard],
    loadComponent: () => import('./pages/paciente/psicologo/psicologo.page').then( m => m.PsicologoPage)
  },
  {
    path: 'odontologia',
    canActivate:[adminGuard],
    loadComponent: () => import('./pages/paciente/odontologia/odontologia.page').then( m => m.OdontologiaPage)
  },
  {
    path: 'personal-some',
    canActivate:[adminGuard],
    loadComponent: () => import('./pages/personal-some/personal-some.page').then( m => m.PersonalSomePage)
  },
  {
    path: 'gestion-disponibilidad',
    canActivate:[adminGuard],
    loadComponent: () => import('./pages/personal-some/gestion-disponibilidad/gestion-disponibilidad.page').then( m => m.GestionDisponibilidadPage)
  }


];