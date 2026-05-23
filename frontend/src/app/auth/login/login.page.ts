import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonContent, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonInput, IonLabel, IonButton, IonIcon,
  ToastController, LoadingController } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { eyeOutline, eyeOffOutline } from 'ionicons/icons';

// Firebase y HTTP
import { Auth, signInWithEmailAndPassword } from '@angular/fire/auth';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [ CommonModule, FormsModule, IonContent, IonCard, IonCardHeader, 
  IonCardTitle, IonCardContent, IonInput, IonLabel, IonButton, IonIcon ]
})
export class LoginPage {

  // Variables para el formulario
  emailValue: string = '';
  passwordValue: string = ''; // Esta es la variable que contiene la clave
  
  // Variables para la visualización de contraseña
  passwordType: string = 'password';
  showPassword: boolean = false;

  // Inyección de servicios (estilo Standalone)
  private auth: Auth = inject(Auth);
  private http: HttpClient = inject(HttpClient);
  private router: Router = inject(Router);
  private toastCtrl: ToastController = inject(ToastController);
  private loadingCtrl: LoadingController = inject(LoadingController);

  constructor() {
    addIcons({ eyeOutline, eyeOffOutline });
  }

  togglePassword() {
    this.showPassword = !this.showPassword;
    this.passwordType = this.showPassword ? 'text' : 'password';
  }

  async iniciarSesion() {
    if (!this.emailValue || !this.passwordValue) {
      this.mostrarToast('Por favor, completa todos los campos', 'warning');
      return;
    }

    const loading = await this.loadingCtrl.create({
      message: 'Autenticando...',
      spinner: 'crescent'
    });
    await loading.present();

    try {
      // 1. Autenticación en Firebase Auth
      const userCredential = await signInWithEmailAndPassword(
        this.auth,
        this.emailValue.trim(),
        this.passwordValue
      );
      const uid = userCredential.user.uid;
      const emailLogueado = userCredential.user.email?.toLowerCase() || '';

      // --- BYPASS DE EMERGENCIA PARA DESARROLLO ---
      // Si el correo termina en @cesfam.cl, entra directo a SOME sin pasar por Oracle
      if (emailLogueado.endsWith('@cesfam.cl')) {
        loading.dismiss();
        console.log('Bypass activado: Correo institucional detectado. Redirigiendo a SOME...');
        this.router.navigate(['/personal-some']);
        return; // Detiene la ejecución aquí
      }

      // 2. Consulta del Rol en el servidor Oracle si no es correo institucional (Cambiado a <any>)
      this.http.get<any>(`http://localhost:3000/api/obtener-rol/${uid}`)
        .subscribe({
          next: (res) => {
            loading.dismiss();
            
            // Verificamos el formato del objeto JSON devuelto por Node
            if (res && res.success && res.rol) {
              
              // Mapeamos según los roles en texto que entrega tu backend
              if (res.rol === 'SOME') {
                this.router.navigate(['/personal-some']); // Redirige a SOME
              } else if (res.rol === 'PACIENTE') {
                this.router.navigate(['/paciente-home']); // Redirige a PACIENTE
              } else {
                this.mostrarToast('Rol desconocido en el sistema', 'warning');
              }

            } else {
              this.mostrarToast('El usuario no tiene un rol asignado en el sistema', 'danger');
            }
          },
          error: (err) => {
            loading.dismiss();
            console.error('Error 500 o 404 detectado en API:', err);
            this.mostrarToast('Error de comunicación con el servidor', 'danger');
          }
        });
    } catch (error: any) {
      loading.dismiss();
      console.error('Error de Firebase:', error.code);
      this.manejarErrorFirebase(error.code);
    }
  }

  private async mostrarToast(mensaje: string, color: string) {
    const toast = await this.toastCtrl.create({
      message: mensaje,
      duration: 2000,
      color: color,
      position: 'bottom'
    });
    toast.present();
  }

  private manejarErrorFirebase(code: string) {
    switch (code) {
      case 'auth/user-not-found':
      case 'auth/invalid-credential': 
        this.mostrarToast('Correo o contraseña incorrectos', 'danger');
        break;
      case 'auth/wrong-password':
        this.mostrarToast('Contraseña incorrecta', 'danger');
        break;
      case 'auth/invalid-email':
        this.mostrarToast('Correo electrónico no válido', 'warning');
        break;
      default:
        this.mostrarToast('Error al iniciar sesión: ' + code, 'danger');
    }
  }

  irAlRegistro() {
    this.router.navigate(['/register']);
  }
}