import { inject } from '@angular/core';
import { CanActivateFn, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Auth } from '@angular/fire/auth';
import { of, from } from 'rxjs';
import { switchMap, map, catchError } from 'rxjs/operators';

export const adminGuard: CanActivateFn = (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
  const auth = inject(Auth);
  const router = inject(Router);
  const http = inject(HttpClient);

  return from(Promise.resolve(auth.currentUser)).pipe(
    switchMap(usuario => {
      // NO LOGEADO
      if (!usuario) {
        router.navigate(['/login']);
        return of(false);
      }

      return http.get<any>(`http://localhost:3000/api/obtener-rol/${usuario.uid}`).pipe(
        map(res => {
          if (!res.success) {
            router.navigate(['/login']);
            return false;
          }

          const rol = res.rol;
          const ruta = state.url;

          // VISTAS ADMIN
          const vistasAdmin = [
            '/personal-some', 
            '/gestion-disponibilidad'
          ];

          // VISTAS PACIENTE
          const vistasPaciente = [
            '/paciente-home',
            '/mis-horas',
            '/control-medico',
            '/odontologia',
            '/psicologo',
            '/agendar',
            '/perfil'
          ];

          // SOME entra a TODO
          if (rol === 'SOME') {
            return true;
          }

          // PACIENTE solo ingresa a sus vistas autorizadas
          if (rol === 'PACIENTE') {
            if (vistasPaciente.some(vista => ruta.startsWith(vista))) {
              return true;
            }
            router.navigate(['/paciente-home']);
            return false;
          }

          // ROL DESCONOCIDO
          router.navigate(['/login']);
          return false;
        }),
        catchError(() => {
          router.navigate(['/login']);
          return of(false);
        })
      );
    })
  );
};