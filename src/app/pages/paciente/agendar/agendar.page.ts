import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { 
  documentTextOutline, 
  happyOutline, 
  thumbsUpOutline, 
  informationCircleOutline 
} from 'ionicons/icons';

@Component({
  selector: 'app-agendar',
  templateUrl: './agendar.page.html',
  styleUrls: ['./agendar.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class AgendarPage {

  constructor() {
    addIcons({ 
      documentTextOutline, 
      happyOutline, 
      thumbsUpOutline, 
      informationCircleOutline 
    });
  }

  selectService(service: string) {
    console.log('Servicio seleccionado:', service);
    // Aquí podrías navegar al siguiente paso de la reserva
  }

}