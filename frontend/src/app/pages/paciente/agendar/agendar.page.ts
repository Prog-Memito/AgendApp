import { Component, inject } from '@angular/core'; 
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { Router } from '@angular/router'; 
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

  /**
   * Al hacer clic, guardamos el ID_SERV de Oracle y redirigimos a la vista correspondiente
   */
  Servicio(service: string, idServicio: number) {
    console.log(`🎯 Servicio seleccionado: ${service} (ID_SERV: ${idServicio})`);
    
    // Almacenamos el ID numérico de la tabla CARTA_SERVICIO en el navegador
    localStorage.setItem('id_servicio_seleccionado', idServicio.toString());

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