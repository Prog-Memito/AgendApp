import { Injectable, inject } from '@angular/core';
import { Auth, signInWithEmailAndPassword, signOut } from '@angular/fire/auth';


@Injectable({
  providedIn: 'root',
})
export class AuthService  {

  private auth = inject(Auth);

  async login(email: string, password: string) {
    return signInWithEmailAndPassword(
      this.auth,
      email,
      password
    );
  }

  async logout() {
    return signOut(this.auth);
  }

  get usuarioActual() {
    return this.auth.currentUser;
  }
}
