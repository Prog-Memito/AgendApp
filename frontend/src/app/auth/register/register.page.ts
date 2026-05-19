import { Component, OnInit, inject } from '@angular/core'; // Añadimos inject
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { 
  IonContent, IonHeader, IonTitle, IonToolbar, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonLabel, IonItem, 
  IonInput, IonButton, IonIcon, ToastController, LoadingController // Añadimos controladores de UI
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { personAddOutline, eyeOutline, eyeOffOutline, alertCircleOutline } from 'ionicons/icons';

// IMPORTANTE: Importamos las herramientas de Firebase y HTTP
import { Auth, createUserWithEmailAndPassword } from '@angular/fire/auth';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment'; // Importamos tu nueva config

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule, IonCard, IonCardHeader,
    IonCardTitle, IonCardContent, IonLabel, IonItem, IonInput, IonButton, IonIcon
  ]
})
export class RegisterPage implements OnInit {
  
  // Inyección de servicios necesarios
  private auth: Auth = inject(Auth); 
  private http: HttpClient = inject(HttpClient);
  private router: Router = inject(Router);
  private toastCtrl: ToastController = inject(ToastController);
  private loadingCtrl: LoadingController = inject(LoadingController);

  paso: number = 1;
  rutValue: string = '';
  emailValue: string = '';
  passwordValue: string = '';
  confirmPasswordValue: string = '';
  showPassword = false;
  passwordType = 'password';

  constructor() {
    addIcons({ personAddOutline, eyeOutline, eyeOffOutline, alertCircleOutline });
  }

  ngOnInit() {}

  togglePassword() {
    this.showPassword = !this.showPassword;
    this.passwordType = this.showPassword ? 'text' : 'password';
  }

  onRutInput(event: any) {
    let valorRaw = event.target.value.toUpperCase().replace(/[^0-9K]/g, '');
    if (valorRaw.includes('K')) {
      const posicionK = valorRaw.indexOf('K');
      if (posicionK !== valorRaw.length - 1) {
        valorRaw = valorRaw.replace(/K/g, '');
      }
    }
    if (valorRaw.length > 9) valorRaw = valorRaw.slice(0, 9);

    if (valorRaw.length < 2) {
      this.rutValue = valorRaw;
    } else {
      let cuerpo = valorRaw.slice(0, -1);
      let dv = valorRaw.slice(-1);
      cuerpo = cuerpo.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
      this.rutValue = `${cuerpo}-${dv}`;
    }
    event.target.value = this.rutValue;
  }

  siguientePaso() {
    if (this.rutValue.length >= 11) {
      this.paso = 2;
    } else {
      this.mostrarToast('RUT incompleto o inválido', 'warning');
    }
  }

  volverPaso() {
    this.paso = 1;
  }

  /**
   * Finaliza el registro guardando datos en Firebase y Oracle
   */
  async registrarUsuario() {
    // Validamos contraseñas
    if (this.passwordValue !== this.confirmPasswordValue) {
      this.mostrarToast('Las contraseñas no coinciden', 'danger');
      return;
    }

    const loading = await this.loadingCtrl.create({ message: 'Creando cuenta...' });
    await loading.present();

    try {
      // 1. CREAR USUARIO EN FIREBASE
      // Esta línea es la que guarda el email y clave en la nube de Google
      const userCredential = await createUserWithEmailAndPassword(
        this.auth, 
        this.emailValue, 
        this.passwordValue
      );
      
      const uid = userCredential.user.uid; // Obtenemos el ID único generado por Firebase

      // 2. VINCULAR CON ORACLE (Node.js)
      // Esta línea envía el UID y el RUT a tu servidor para que Oracle sepa quién es quién
      const datosVinculacion = {
        email: this.emailValue,
        run: this.rutValue,
        firebaseUID: uid
      };

      this.http.post('http://localhost:3000/api/vincular-paciente', datosVinculacion)
        .subscribe({
          next: async (res: any) => {
            await loading.dismiss();
            this.mostrarToast('Registro completado con éxito', 'success');
            this.router.navigate(['/login']);
          },
          error: async (err) => {
            await loading.dismiss();
            console.error('Error Oracle:', err);
            this.mostrarToast('Usuario creado en Firebase, pero falló la vinculación local', 'warning');
          }
        });

    } catch (error: any) {
      await loading.dismiss();
      console.error('Error Firebase:', error);
      this.mostrarToast('Error al crear cuenta: ' + error.message, 'danger');
    }
  }

  async mostrarToast(mensaje: string, color: string) {
    const toast = await this.toastCtrl.create({
      message: mensaje,
      duration: 2500,
      color: color
    });
    toast.present();
  }

  irAlLogin() {
    this.router.navigate(['/login']);
  }
}