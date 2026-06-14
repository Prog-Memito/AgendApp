import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { Auth } from '@angular/fire/auth';
import { CanActivateFn } from '@angular/router';

export const loginGuard: CanActivateFn = async () => {

  const auth = inject(Auth);
  const router = inject(Router);

  return new Promise((resolve) => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      unsubscribe();
      if (user) {
        router.navigate(['/inicio']);
        resolve(false);
      } else {
        resolve(true);
      }
    });
  });

};