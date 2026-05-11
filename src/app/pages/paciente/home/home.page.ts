import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { Router, RouterModule } from '@angular/router';
import { addIcons } from 'ionicons';
import { addOutline, calendarOutline, personOutline } from 'ionicons/icons';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, RouterModule]
})
export class InicioPage {
  private router = inject(Router);

  constructor() {
    // Registrar los iconos que usamos en el HTML
    addIcons({ addOutline, calendarOutline, personOutline });
  }

  logout() {
    // Aquí llamarás a tu AuthService.logout() más adelante
    this.router.navigate(['/auth/login']);
  }
}