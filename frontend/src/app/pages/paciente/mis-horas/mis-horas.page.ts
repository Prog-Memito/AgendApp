import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Auth } from '@angular/fire/auth';
import { IonicModule, LoadingController, ToastController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { calendarOutline, timeOutline, personOutline } from 'ionicons/icons';

@Component({
  selector: 'app-mis-horas',
  templateUrl: './mis-horas.page.html',
  styleUrls: ['./mis-horas.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class MisHorasPage implements OnInit {
  // Inyecciones de dependencias usando inject()
  private http = inject(HttpClient);
  private auth = inject(Auth);
  private loadingCtrl = inject(LoadingController);
  private toastCtrl = inject(ToastController);

  // Propiedades de la clase
  horasPaciente: any[] = [];
  cargando = true;

  constructor() {
    addIcons({
      calendarOutline,
      timeOutline,
      personOutline
    });
  }

  ngOnInit() {
    this.cargarHorasPaciente();
  }

  async cargarHorasPaciente() {
    const usuario = this.auth.currentUser;
    if (!usuario) {
      this.cargando = false;
      return;
    }

    const loading = await this.loadingCtrl.create({
      message: 'Cargando horas médicas...'
    });
    await loading.present();

    this.http.get<any[]>(`http://localhost:3000/api/mis-horas/${usuario.uid}`)
      .subscribe({
        next: (res) => {
          loading.dismiss();
          this.horasPaciente = res || [];
          this.cargando = false;
        },
        error: (err) => {
          loading.dismiss();
          console.error("Error al cargar horas del paciente:", err);
          this.cargando = false;
          this.mostrarToast('No se pudieron cargar las horas', 'danger');
        }
      });
  }

  puedeConfirmar(cita: any): boolean {
  const fechaCita = new Date(cita.FECHA_HORA);

  const diferenciaHoras =
    (fechaCita.getTime() - Date.now()) /
    (1000 * 60 * 60);

  console.log(
    cita.FECHA_HORA,
    diferenciaHoras
  );

  return diferenciaHoras <= 24 && diferenciaHoras > 0;
}

confirmarAsistencia(cita: any) {
  this.http.post('http://localhost:3000/api/confirmar-asistencia', {
    idCita: cita.ID_CITA
  }).subscribe({
    next: () => {
      this.mostrarToast('Asistencia confirmada', 'success');
    },
    error: () => {
      this.mostrarToast('No se pudo confirmar', 'danger');
    }
  });
}

cancelarReserva(cita: any) {
  this.http.post('http://localhost:3000/api/cancelar-cita', {
    idCita: cita.ID_CITA
  }).subscribe({
    next: () => {
      this.mostrarToast('Reserva cancelada', 'success');
      this.cargarHorasPaciente();
    },
    error: () => {
      this.mostrarToast('No se pudo cancelar', 'danger');
    }
  });
}

  async mostrarToast(mensaje: string, color: string) {
    const toast = await this.toastCtrl.create({
      message: mensaje,
      duration: 2500,
      color: color
    });
    await toast.present();
  }
}