import { Routes } from '@angular/router';

import { Login } from './pages/auth/login/login';
import { Inicio } from './pages/inicio/inicio';
import { Citas } from './pages/citas/citas'
import { Horarios } from './pages/horarios/horarios';

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
    }

];
