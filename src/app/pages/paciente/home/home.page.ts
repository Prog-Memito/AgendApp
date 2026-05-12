import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { Router, RouterModule } from '@angular/router';
import { addIcons } from 'ionicons';
import { 
  addOutline, 
  calendarOutline, 
  personOutline, 
  chevronForwardOutline 
} from 'ionicons/icons';

@Component({
  selector: 'app-home-paciente',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, RouterModule]
})
export class InicioPage {
  private router = inject(Router);
  rutValue: string = '12.345.678-K';

  constructor() {
    addIcons({ 
      addOutline, 
      calendarOutline, 
      personOutline, 
      chevronForwardOutline 
    });
  }

  logout() {
    this.router.navigate(['/login']);
  }

  irAAgendar() { console.log('Agendar'); }
  irAMisHoras() { console.log('Mis Horas'); }
  irAPerfil() { console.log('Perfil'); }
}