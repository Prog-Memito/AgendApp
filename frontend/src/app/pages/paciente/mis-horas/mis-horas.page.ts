import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { calendarOutline } from 'ionicons/icons';

@Component({
  selector: 'app-mis-horas',
  templateUrl: './mis-horas.page.html',
  styleUrls: ['./mis-horas.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class MisHorasPage implements OnInit {

  constructor() {
    addIcons({ calendarOutline });
  }

  ngOnInit() {}
}