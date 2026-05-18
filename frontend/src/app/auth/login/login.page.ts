import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { 
  IonContent, IonCard, IonCardHeader, IonCardTitle, 
  IonCardContent, IonInput, IonLabel, IonButton, IonIcon 
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { eyeOutline, eyeOffOutline } from 'ionicons/icons';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [
    CommonModule, FormsModule, IonContent, IonCard, IonCardHeader, 
    IonCardTitle, IonCardContent, IonInput, IonLabel, IonButton, IonIcon
  ]
})
export class LoginPage {

  // Variables para el formulario
  emailValue: string = '';
  passwordValue: string = '';
  
  // Variables para la visualización de contraseña
  passwordType: string = 'password';
  showPassword: boolean = false;

  constructor(private router: Router) {
    addIcons({ eyeOutline, eyeOffOutline });
  }

  // Alternar visualización de contraseña
  togglePassword() {
    this.showPassword = !this.showPassword;
    this.passwordType = this.showPassword ? 'text' : 'password';
  }

  iniciarSesion() {
    // Por ahora solo mostramos en consola para verificar que captura los datos
    console.log('Intentando iniciar sesión con Email:', this.emailValue);
    
    // Aquí irá la lógica de Firebase más adelante
    this.router.navigate(['/paciente-home']); 
  }

  irAlRegistro() {
    this.router.navigate(['/register']);
  }
}