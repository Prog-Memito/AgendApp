import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Api } from '../../../services/api';
import { Auth, signInWithEmailAndPassword } from '@angular/fire/auth';

@Component({
  selector: 'app-login',
  imports: [ CommonModule, FormsModule ],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {

  private auth = inject(Auth);

  email = '';
  password = '';

  private api = inject(Api);
  private router = inject(Router);

  async login() {
  try {
    const credenciales = await signInWithEmailAndPassword(this.auth, this.email, this.password);
    console.log('Usuario Firebase:', credenciales.user);
    const uid = credenciales.user.uid;
    console.log('UID:', uid);

    this.api.obtenerRol(uid).subscribe({
      next: (resp: any) => {
        console.log('Respuesta backend:', resp);
        if (resp.rol === 'SOME') {
          localStorage.setItem('uid', uid);
          this.router.navigate(['/dashboard']);
        } else {
          alert('No posee permisos para acceder al panel administrativo');
        }
      },
      error: () => {
        alert('Usuario no registrado como SOME');
      }
    });

  } catch (error) {
    console.error(error);
    alert('Correo o contraseña incorrectos');
  }
}
}
