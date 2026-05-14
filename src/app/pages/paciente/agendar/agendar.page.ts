import { Component, inject } from '@angular/core'; // Añadimos inject
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { Router } from '@angular/router'; // Importamos el Router
import { addIcons } from 'ionicons';
import { documentTextOutline, happyOutline, thumbsUpOutline, informationCircleOutline } from 'ionicons/icons';

@Component({
  selector: 'app-agendar',  
  templateUrl: './agendar.page.html',
  styleUrls: ['./agendar.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class AgendarPage {

  private router = inject(Router);

  constructor() {
    addIcons({ 
      documentTextOutline, 
      happyOutline, 
      thumbsUpOutline, 
      informationCircleOutline 
    });
  }

  Servicio(service: string) {
    console.log('Servicio seleccionado:', service);
    switch (service) {
      case 'control-medico':
        this.router.navigate(['/control-medico']);
        break;
      case 'psicologo':
        this.router.navigate(['/psicologo']);
        break;
      case 'odontologia':
        this.router.navigate(['/odontologia']);
        break;
      default:
        console.warn('Ruta no encontrada:', service);
    }
  }

}