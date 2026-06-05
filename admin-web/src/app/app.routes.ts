import { Routes } from '@angular/router';

import { Login } from './pages/auth/login/login';
import { Inicio } from './pages/inicio/inicio';
import { Citas } from './pages/citas/citas'
import { Horarios } from './pages/horarios/horarios';
import { Medicos } from './pages/medicos/medicos';
import { Pacientes } from './pages/pacientes/pacientes';

export const routes: Routes = [
    {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
    },
    {
    path: 'login',
    component: Login
    },
    {
    path: 'inicio',
    component: Inicio
    },
    {
    path: 'citas',
    component: Citas
    },
    {
    path: 'horarios',
    component: Horarios
    },
    {
    path: 'medicos',
    component: Medicos
    },
    {
    path: 'pacientes',
    component: Pacientes
    },

];
