import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ToastController, LoadingController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { businessOutline, idCardOutline, timeOutline, eyeOutline, eyeOffOutline, alertCircleOutline } from 'ionicons/icons';

// Firebase e HTTP
import { Auth, updateEmail, updatePassword, reauthenticateWithCredential, EmailAuthProvider } from '@angular/fire/auth';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-perfil',
  templateUrl: './perfil.page.html',
  styleUrls: ['./perfil.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class PerfilPage implements OnInit {

  // Inyección de servicios
  private auth = inject(Auth);
  private http = inject(HttpClient);
  private toastCtrl = inject(ToastController);
  private loadingCtrl = inject(LoadingController);

  // Control de estados de la interfaz
  editando: boolean = false;
  cambiandoPassword: boolean = false;

  // Estados de visualización del ojo
  verNuevaPassword: boolean = false;
  verConfirmarPassword: boolean = false;
  verActualPassword: boolean = false;

  // Variables de despliegue (Perfil)
  nombrePaciente: string = 'Cargando...';
  runPaciente: string = '';
  emailPacienteEstatico: string = '';

  // Modelos para manejar y validar los datos ingresados
  emailUsuario: string = '';
  nuevaClave: string = '';
  confirmarClave: string = '';
  actualClave: string = '';

  constructor() {
    addIcons({ businessOutline, idCardOutline, timeOutline, eyeOutline, eyeOffOutline, alertCircleOutline });
  }

  ngOnInit() {
    this.cargarDatosPerfil();
  }

  async cargarDatosPerfil() {
    const user = this.auth.currentUser;
    if (user) {
      this.emailPacienteEstatico = user.email || '';
      this.emailUsuario = user.email || '';
      
      // Consultamos los datos completos a tu API usando el UID
      this.http.get<{success: boolean, nombre: string, run: string}>(`http://localhost:3000/api/perfil-completo-paciente/${user.uid}`)
        .subscribe({
          next: (res) => {
            if (res.success) {
              this.nombrePaciente = res.nombre;
              this.runPaciente = res.run;
            }
          },
          error: (err) => {
            console.error('Error al traer perfil:', err);
            this.mostrarToast('No se pudieron cargar algunos datos locales.', 'warning');
          }
        });
    }
  }

  activarEdicion() {
    this.editando = true;
  }

  cancelarEdicion() {
    this.editando = false;
    this.cambiandoPassword = false;
    // Restauramos el email original si se cancela
    this.emailUsuario = this.emailPacienteEstatico;
    this.resetFormulario();
  }

  togglePasswordForm() {
    this.cambiandoPassword = !this.cambiandoPassword;
    this.resetFormulario();
  }

  // Limpia los valores y resetea los ojitos
  resetFormulario() {
    this.verNuevaPassword = false;
    this.verConfirmarPassword = false;
    this.verActualPassword = false;
    this.nuevaClave = '';
    this.confirmarClave = '';
    this.actualClave = '';
  }

  //Proceso de actualización seguro (Firebase + Oracle)
  async guardarCambios() {
    const user = this.auth.currentUser;
    if (!user) return;

    const loading = await this.loadingCtrl.create({ message: 'Procesando actualizaciones de seguridad...' });
    await loading.present();

    try {
      // PASO 1: Reautenticar al usuario con su contraseña actual (Regla estricta de Firebase)
      const credencial = EmailAuthProvider.credential(user.email || '', this.actualClave);
      await reauthenticateWithCredential(user, credencial);

      // PASO 2: Si el usuario cambió el correo electrónico
      if (this.emailUsuario.trim() !== this.emailPacienteEstatico) {
        await updateEmail(user, this.emailUsuario.trim());
      }

      // PASO 3: Si el usuario decidió cambiar la contraseña
      if (this.cambiandoPassword && this.nuevaClave.length >= 6) {
        await updatePassword(user, this.nuevaClave);
      }

      // PASO 4: Sincronizar cambios en la base de datos de Oracle (Node.js)
      const datosActualizados = {
        uid: user.uid,
        nuevoEmail: this.emailUsuario.trim()
      };

      this.http.put('http://localhost:3000/api/actualizar-perfil-paciente', datosActualizados)
        .subscribe({
          next: async (res: any) => {
            await loading.dismiss();
            this.mostrarToast('Perfil actualizado con éxito en todos los sistemas.', 'success');
            this.editando = false;
            this.cambiandoPassword = false;
            // Refrescamos los datos de la vista
            this.cargarDatosPerfil();
            this.resetFormulario();
          },
          error: async (err) => {
            await loading.dismiss();
            console.error('Error de sincronización con Oracle:', err);
            this.mostrarToast('Actualizado en Firebase, pero falló la sincronización con la base médica.', 'warning');
          }
        });

    } catch (error: any) {
      await loading.dismiss();
      console.error('Error en proceso de seguridad:', error);
      this.manejarErroresSeguridad(error.code);
    }
  }

  private manejarErroresSeguridad(code: string) {
    switch (code) {
      case 'auth/wrong-password':
        this.mostrarToast('La contraseña actual ingresada es incorrecta.', 'danger');
        break;
      case 'auth/email-already-in-use':
        this.mostrarToast('El nuevo correo electrónico ya está en uso por otra cuenta.', 'danger');
        break;
      case 'auth/weak-password':
        this.mostrarToast('La nueva contraseña debe tener al menos 6 caracteres.', 'warning');
        break;
      default:
        this.mostrarToast('Error de autenticación al guardar cambios.', 'danger');
    }
  }

  async mostrarToast(mensaje: string, color: string) {
    const toast = await this.toastCtrl.create({ message: mensaje, duration: 2500, color: color });
    toast.present();
  }
}