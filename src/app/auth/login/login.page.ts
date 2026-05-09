import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router'; // Importamos el Router para la navegación
import { 
  IonContent, 
  IonHeader, 
  IonTitle, 
  IonToolbar, 
  IonCard, 
  IonCardHeader, 
  IonCardTitle, 
  IonCardContent, 
  IonLabel, 
  IonItem, 
  IonInput, 
  IonButton, 
  IonIcon 
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { clipboardOutline } from 'ionicons/icons';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [
    IonContent, 
    IonHeader, 
    IonTitle, 
    IonToolbar, 
    CommonModule, 
    FormsModule,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonLabel,
    IonItem,
    IonInput,
    IonButton,
    IonIcon
  ]
})
export class LoginPage implements OnInit {

  // Inyectamos el Router en el constructor
  constructor(private router: Router) {
    addIcons({ clipboardOutline });
  }

  ngOnInit() {}

  // Esta función es la que llamaremos desde el botón en el HTML
  irAlRegistro() {
    this.router.navigate(['/register']);
  }

}