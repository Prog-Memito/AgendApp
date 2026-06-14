import { Routes } from '@angular/router';
import { authGuard } from './guards/auth-guard';
import { loginGuard } from './guards/login-guard';

import { Login } from './pages/auth/login/login';
import { Inicio } from './pages/inicio/inicio';
import { Citas } from './pages/citas/citas'
import { Horarios } from './pages/horarios/horarios';
import { Medicos } from './pages/medicos/medicos';
import { Pacientes } from './pages/pacientes/pacientes';
import { Some } from './pages/some/some';

export const routes: Routes = [
    {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
    },
    {
    path: 'login',
    component: Login,
    canActivate: [loginGuard]
    },
    {
    path: 'inicio',
    component: Inicio,
    canActivate: [authGuard]
    },
    {
    path: 'citas',
    component: Citas,
    canActivate: [authGuard]
    },
    {
    path: 'horarios',
    component: Horarios,
    canActivate: [authGuard]
    },
    {
    path: 'medicos',
    component: Medicos,
    canActivate: [authGuard]
    },
    {
    path: 'pacientes',
    component: Pacientes,
    canActivate: [authGuard]
    },
    {
    path: 'some',
    component: Some,
    canActivate: [authGuard]
    }

];
