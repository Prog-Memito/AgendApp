import { Component, ViewChild } from '@angular/core';
import { CommonModule, formatDate } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, IonModal } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { calendarOutline, moonOutline, informationCircleOutline } from 'ionicons/icons';

@Component({
  selector: 'app-odontologia',
  templateUrl: './odontologia.page.html',
  styleUrls: ['./odontologia.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class OdontologiaPage {
  // Usamos el ID del modal para mayor precisión
  @ViewChild('modalCalendario') modal!: IonModal; 

  minDate: string = new Date().toISOString();
  fechaSeleccionada: boolean = false;
  fechaFormateada: string = '';
  dateValue: string = ''; 

  constructor() {
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
    console.log('Cambiando tipo...');
  }

}
