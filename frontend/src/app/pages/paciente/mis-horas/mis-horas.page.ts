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

  async mostrarToast(mensaje: string, color: string) {
    const toast = await this.toastCtrl.create({
      message: mensaje,
      duration: 2500,
      color: color
    });
    await toast.present();
  }
}