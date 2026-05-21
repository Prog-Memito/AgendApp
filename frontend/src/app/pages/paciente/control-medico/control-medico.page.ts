import { Component, ViewChild, inject } from '@angular/core';
import { CommonModule, formatDate } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, IonModal, NavController, LoadingController, ToastController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { calendarOutline, moonOutline, informationCircleOutline, searchOutline } from 'ionicons/icons';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-control-medico',
  templateUrl: './control-medico.page.html',
  styleUrls: ['./control-medico.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class ControlMedicoPage {
  @ViewChild('modalCalendario') modal!: IonModal; 

  private navCtrl = inject(NavController);
  private http = inject(HttpClient);
  private loadingCtrl = inject(LoadingController);
  private toastCtrl = inject(ToastController);

  minDate: string = new Date().toISOString();
  fechaSeleccionada: boolean = false;
  mostrarContenido: boolean = false; // Controla si ya se ejecutó la búsqueda activa
  fechaFormateada: string = '';
  dateValue: string = ''; 
  listaMedicos: any[] = [];

  constructor() {
    addIcons({ calendarOutline, moonOutline, informationCircleOutline, searchOutline });
  }

  onDateChange(event: any) {
    const value = event.detail.value;
    if (value) {
      this.dateValue = value;
      this.fechaSeleccionada = true;
      this.fechaFormateada = formatDate(value, 'EEE dd MMM', 'es-CL');
      this.modal.dismiss();
      
      console.log('1. Fecha seleccionada en el componente:', this.dateValue);
    }
  }

  async buscarHorasManual() {
    if (!this.dateValue) return;

    const fechaLimpia = this.dateValue.split('T')[0];
    console.log('2. Enviando petición HTTP a Node con la fecha:', fechaLimpia);

    const loading = await this.loadingCtrl.create({
      message: 'Consultando agenda en Oracle...',
      spinner: 'crescent'
    });
    await loading.present();

    this.http.get<any[]>(`http://localhost:3000/api/disponibilidad-medica/${fechaLimpia}`)
      .subscribe({
        next: (res) => {
          loading.dismiss();
          this.mostrarContenido = true;
          this.listaMedicos = res;
          
          console.log('3. Respuesta del servidor procesada en el Frontend:', res);
          
          if (res.length === 0) {
            this.mostrarToast('No se encontraron médicos para este día.', 'warning');
          } else {
            this.mostrarToast('Horas cargadas exitosamente.', 'success');
          }
        },
        error: (err) => {
          loading.dismiss();
          this.mostrarContenido = true;
          this.listaMedicos = [];
          console.error('❌ Error de comunicación con el Backend:', err);
          this.mostrarToast('Error al conectar con el servidor médico.', 'danger');
        }
      });
  }

  async mostrarToast(mensaje: string, color: string) {
    const toast = await this.toastCtrl.create({ message: mensaje, duration: 2000, color: color });
    toast.present();
  }

  cambiarTipo() {
    this.navCtrl.navigateBack('/agendar'); 
  }
}