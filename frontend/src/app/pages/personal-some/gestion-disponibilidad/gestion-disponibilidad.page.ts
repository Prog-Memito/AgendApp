import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, NavController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { chevronBackOutline, informationCircleOutline, calendarOutline } from 'ionicons/icons';

@Component({
  selector: 'app-gestion-disponibilidad',
  templateUrl: './gestion-disponibilidad.page.html',
  styleUrls: ['./gestion-disponibilidad.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class GestionDisponibilidadPage implements OnInit {

  private navCtrl = inject(NavController);

  constructor() {
    addIcons({ chevronBackOutline, informationCircleOutline, calendarOutline });
  }

  ngOnInit() {}

  volverAlDashboard() {
    this.navCtrl.navigateBack('/personal-some');
  }
}