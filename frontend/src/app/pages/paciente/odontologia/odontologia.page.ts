import { Component, ViewChild, inject } from '@angular/core';
import { CommonModule, formatDate } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, IonModal, NavController, LoadingController, ToastController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { calendarOutline, moonOutline, informationCircleOutline, searchOutline } from 'ionicons/icons';
import { HttpClient } from '@angular/common/http';

import { Auth } from '@angular/fire/auth';

@Component({
  selector: 'app-odontologia',
  templateUrl: './odontologia.page.html',
  styleUrls: ['./odontologia.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class OdontologiaPage {
  @ViewChild('modalCalendario') modal!: IonModal; 

  private navCtrl = inject(NavController);
  private http = inject(HttpClient);
  private loadingCtrl = inject(LoadingController);
  private toastCtrl = inject(ToastController);
  private auth = inject(Auth);

  minDate: string = new Date().toISOString();
  fechaSeleccionada: boolean = false;
  mostrarContenido: boolean = false; 
  fechaFormateada: string = '';
  dateValue: string = ''; 
  listaMedicos: any[] = [];

  // NUEVAS VARIABLES: Control de estado del modal de confirmación
  isConfirmModalOpen: boolean = false;
  doctorSeleccionado: string = '';
  horaSeleccionada: string = '';
  idHorarioSeleccionado: number | null = null;

  constructor() {
    addIcons({ calendarOutline, moonOutline, informationCircleOutline, searchOutline });
  }

  ngOnInit() {
    this.cargarSesionDeEmergencia();
  }

  async cargarSesionDeEmergencia() {
    const runExistente = localStorage.getItem('run_paciente');
    // Si ya existe en el localStorage, no hacemos nada
    if (runExistente) return;
    console.log('⚠️ LocalStorage vacío en Odontología. Rescatando sesión desde Firebase...');
    const usuarioActual = this.auth.currentUser;
    if (usuarioActual) {
      const uid = usuarioActual.uid;
      // Consultamos a tu API de Node los datos usando el UID que sí está activo
      this.http.get<{success: boolean, nombre: string, run: string}>(`http://localhost:3000/api/datos-paciente/${uid}`)
        .subscribe({
          next: (res) => {
            if (res.success && res.run) {
              localStorage.setItem('run_paciente', res.run);
              console.log('✅ Sesión recuperada y guardada con éxito en Odontología:', res.run);
            }
          },
          error: (err) => console.error('No se pudo sincronizar la sesión con Oracle:', err)
        });
    }
  }

  onDateChange(event: any) {
    const value = event.detail.value;
    if (value) {
      this.dateValue = value;
      this.fechaSeleccionada = true;
      this.fechaFormateada = formatDate(value, 'EEE dd MMM', 'es-CL');
      this.modal.dismiss();
    }
  }

  async buscarHorasManual() {
  if (!this.dateValue) return;

  const fechaLimpia = this.dateValue.split('T')[0];
  const servicio = localStorage.getItem('id_servicio_seleccionado') || '1';

  const loading = await this.loadingCtrl.create({
    message: 'Consultando agenda...',
    spinner: 'crescent'
  });
  await loading.present();

  this.http.get<any[]>(`http://localhost:3000/api/disponibilidad-medica/${fechaLimpia}/${servicio}`)
    .subscribe({
      next: (res) => {
        loading.dismiss();
        this.mostrarContenido = true;
        this.listaMedicos = res;

        if (res.length === 0) {
          this.mostrarToast('No hay horas disponibles', 'warning');
        }
      },
      error: (err) => {
        loading.dismiss();
        console.error(err);
        this.listaMedicos = [];
        this.mostrarToast('Error servidor', 'danger');
      }
    });
}
  /**
   * NUEVO: Captura el bloque seleccionado y activa la visualización del modal
   */
  async abrirConfirmacion(medico: any, horario: any) {

  console.log("====== DIAGNÓSTICO ======");

  console.log("Médico completo:", medico);
  console.log("Horario completo:", horario);

  this.doctorSeleccionado =
    medico.nombreMedico;

  this.horaSeleccionada =
    horario.hora || horario;

  // AQUÍ ESTABA EL PROBLEMA
  this.idHorarioSeleccionado =
    horario.idHorario ||
    horario.ID_HORARIO ||
    horario.idAgenda ||
    horario.ID_AGENDA ||
    null;

  console.log("Variables finales:");

  console.log({
    doctor: this.doctorSeleccionado,
    hora: this.horaSeleccionada,
    idHorario: this.idHorarioSeleccionado
  });

  setTimeout(() => {

    this.isConfirmModalOpen = true;

  }, 50);

}
  /**
   * Ejecuta la acción definitiva de inserción en Oracle al presionar "Agendar"
   */
  async confirmarYAgendar() {

  this.isConfirmModalOpen = false;
  if (!this.dateValue) {
    this.mostrarToast(
      'Error: No se ha seleccionado una fecha válida.',
      'danger'
    );
    return;
  }

  const fechaLimpia =
    this.dateValue.split('T')[0];
  const usuarioFirebase =
    this.auth.currentUser;
  if (!usuarioFirebase) {
    this.mostrarToast(
      'Error: No hay sesión Firebase activa.',
      'danger'
    );
    return;
  }

  const idServicioActivo =
    Number(
      localStorage.getItem(
        'id_servicio_seleccionado'
      ) || '7'
    );

  // NUEVA VALIDACIÓN
  if (
    !this.doctorSeleccionado ||
    !this.horaSeleccionada ||
    !this.idHorarioSeleccionado
  ) {

    console.log("ERROR:");

    console.log({

      doctor:
        this.doctorSeleccionado,

      hora:
        this.horaSeleccionada,

      idHorario:
        this.idHorarioSeleccionado
    });
    this.mostrarToast(
      'No se encontró el ID del horario.',
      'danger'
    );
    return;
  }

  const loading =
    await this.loadingCtrl.create({
      message:
        'Registrando su cita médica...',
      spinner:
        'crescent'
    });
  await loading.present();
  const payload = {
    fecha:
      fechaLimpia,
    hora:
      this.horaSeleccionada,
    nombreProfesional:
      this.doctorSeleccionado,
    uidUsuario:
      usuarioFirebase.uid,
    idServicio:
      idServicioActivo,
    // CAMBIO IMPORTANTE
    idHorario:
      this.idHorarioSeleccionado
  };

  console.log(
    "📦 PAYLOAD FINAL:",
    payload
  );

  this.http.post<any>(
    'http://localhost:3000/api/registrar-cita',
    payload
  )
  .subscribe({
    next: (res) => {
      loading.dismiss();
      if (res.success) {
        this.mostrarToast(
          res.message,
          'success'
        );
        this.listaMedicos = [];
        this.mostrarContenido =
          false;
        this.fechaSeleccionada =
          false;
        this.dateValue =
          '';
        this.idHorarioSeleccionado =
          null;
        this.navCtrl.navigateRoot(
          '/paciente-home'
        );
      }
    },
    error: (err) => {
      loading.dismiss();
      console.error(
        "Error registrar:",
        err
      );
      const msg =
        err.error?.error ||
        'No se pudo registrar la cita';
      this.mostrarToast(
        msg,
        'danger'
      );
    }
  });

}

  async mostrarToast(mensaje: string, color: string) {
    const toast = await this.toastCtrl.create({ message: mensaje, duration: 2500, color: color });
    toast.present();
  }

  cambiarTipo() {
    this.navCtrl.navigateBack('/agendar'); 
  }
}