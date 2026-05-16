import { Component, ViewChild } from '@angular/core';
import { CommonModule, formatDate } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, IonModal, NavController } from '@ionic/angular'; // Inyectamos NavController aquí
import { addIcons } from 'ionicons';
import { calendarOutline, moonOutline, informationCircleOutline } from 'ionicons/icons';

@Component({
  selector: 'app-control-medico',
  templateUrl: './control-medico.page.html',
  styleUrls: ['./control-medico.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class ControlMedicoPage {
  // Usamos el ID del modal para mayor precisión
  @ViewChild('modalCalendario') modal!: IonModal; 

  minDate: string = new Date().toISOString();
  fechaSeleccionada: boolean = false;
  fechaFormateada: string = '';
  dateValue: string = ''; 

  // Inyectamos el NavController en el constructor para poder usar la navegación de Ionic
  constructor(private navCtrl: NavController) {
    addIcons({ calendarOutline, moonOutline, informationCircleOutline });
  }

  onDateChange(event: any) {
    const value = event.detail.value;
    if (value) {
      this.dateValue = value;
      this.fechaSeleccionada = true;
      
      // Formateo para las tarjetas de los doctores
      this.fechaFormateada = formatDate(value, 'EEE dd MMM', 'es-CL');
      
      // CERRA EL CALENDARIO INMEDIATAMENTE
      this.modal.dismiss();
    }
  }

  cambiarTipo() {
    console.log('Regresando a la pantalla de selección de atención...');
    
    this.navCtrl.navigateBack('/agendar'); 
  }
}