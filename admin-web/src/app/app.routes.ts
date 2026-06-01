import { Routes } from '@angular/router';

import { Login } from './pages/auth/login/login';
import { Inicio } from './pages/inicio/inicio';

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
    }
];
