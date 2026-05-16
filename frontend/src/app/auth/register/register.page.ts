import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonLabel, 
          IonItem, IonInput, IonButton, IonIcon, ToastController, LoadingController } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { personAddOutline, eyeOutline, eyeOffOutline } from 'ionicons/icons';

// Importamos tu servicio y Firebase
import { AuthService } from '../../services/auth';
import { Auth, createUserWithEmailAndPassword } from '@angular/fire/auth';

@Component({
selector: 'app-register',
templateUrl: './register.page.html',
styleUrls: ['./register.page.scss'],
standalone: true,
imports: [ IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonLabel,
IonItem, IonInput, IonButton, IonIcon
]
})

export class RegisterPage implements OnInit {  

  //Inyeccion de dependencias
  private authService = inject(AuthService);
  private fbAuth = inject(Auth);
  private router = inject(Router);
  private toastCtrl = inject(ToastController);
  private loadingCtrl = inject(LoadingController);

  // Control de flujo (Paso 1: RUT | Paso 2: Email y Pass)
  paso: number = 1;
  
  // Variable que almacena el RUT formateado
  rutValue: string = '';

  //Variables para capturar los datos del Paso 2
  emailValue: string = '';
  passValue: string = '';
  confirmPassValue: string = '';

  // Variables para la visibilidad de la contraseña
  showPassword = false;
  passwordType = 'password';

  constructor() {
    // Agregamos los iconos de la persona y los del ojo para la contraseña
    addIcons({ personAddOutline, eyeOutline, eyeOffOutline });
  }

  ngOnInit() {}

  //Alterna la visibilidad de la contraseña entre texto y puntos
  togglePassword() {
    this.showPassword = !this.showPassword;
    this.passwordType = this.showPassword ? 'text' : 'password';
  }

  /**
  Formatea el RUT en tiempo real: xx.xxx.xxx-x
  Bloquea cualquier letra que no sea K y valida su posición.
  */
  onRutInput(event: any) {
    // 1. Limpieza inicial: Solo números y K
    let valorRaw = event.target.value.toUpperCase().replace(/[^0-9K]/g, '');

    // 2. Validación de la 'K' (solo permitida al final)
    if (valorRaw.includes('K')) {
      const posicionK = valorRaw.indexOf('K');
      if (posicionK !== valorRaw.length - 1) {
        valorRaw = valorRaw.replace(/K/g, '');
      }
    }

    // 3. Limite de caracteres (máximo 9: 8 números + 1 DV)
    if (valorRaw.length > 9) {
      valorRaw = valorRaw.slice(0, 9);
    }

    // 4. Lógica de formateo visual
    if (valorRaw.length < 2) {
      this.rutValue = valorRaw;
    } else {
      let cuerpo = valorRaw.slice(0, -1);
      let dv = valorRaw.slice(-1);
      // Puntos de miles
      cuerpo = cuerpo.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
      this.rutValue = `${cuerpo}-${dv}`;
    }

    // 5. Sincronización forzada con el elemento HTML para evitar parpadeo de letras prohibidas
    event.target.value = this.rutValue;
  }

  //Vlida el paciente en Oracle
  async siguientePaso() {
    const runLimpio = this.rutValue.replace(/\./g, '').replace(/-/g, '');

    if (runLimpio.length < 8) {
      this.mostrarMensaje('RUN invalido', 'warning');
      return;
    }

    const loading = await this.loadingCtrl.create({ message: 'Validando identidad...' });
    await loading.present();

    this.authService.validarPaciente(runLimpio).subscribe({
      next: (res) => {
        loading.dismiss();
        if (res.valido) {
          this.paso = 2;
        }
      },
      error: (err) => {
        loading.dismiss();
        this.mostrarMensaje(err.error.mensaje || 'No registrado en el CESFAM');
      }
    });
  }

  //Firebase + Registro en DB
  async registrarUsuario() {
    if (this.passValue !== this.confirmPassValue) {
      this.mostrarMensaje('Las contraseñas no coinciden');
      return;
    }

    const loading = await this.loadingCtrl.create({ message: 'Creando cuenta...' });
    await loading.present();

    try {
      //Crea en Firebase
      const userCredential = await createUserWithEmailAndPassword(this.fbAuth, this.emailValue, this.passValue);
      const uid = userCredential.user.uid;

      //Vincular en Oracle
      const runLimpio = this.rutValue.replace(/\./g, '').replace(/-/g, '');
      this.authService.vincularPacienteOracle({
        email: this.emailValue,
        run: runLimpio,
        firebaseUID: uid
      }).subscribe({
        next: () => {
          loading.dismiss();
          this.mostrarMensaje('Registro exitoso', 'success');
          this.router.navigate(['/login']);
        },
        error: () => {
          loading.dismiss();
          this.mostrarMensaje('Error al vincular con base de datos');
        }
      });
    } catch (error: any) {
      loading.dismiss();
      this.mostrarMensaje('Error de Firebase: ' + error.message);
    }
  }

  async mostrarMensaje(msg: string, color: string = 'danger') {
    const toast = await this.toastCtrl.create({ message: msg, duration: 2500, color: color });
    toast.present();
  }

  volverPaso() { this.paso = 1; }
  irAlLogin() { this.router.navigate(['/login']); }

}