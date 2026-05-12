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

  rutValue: string = '';
  passwordType: string = 'password';
  showPassword: boolean = false;

  constructor(private router: Router) {
    addIcons({ eyeOutline, eyeOffOutline });
  }

  onRutInput(event: any) {
    let valorRaw = event.target.value.toUpperCase().replace(/[^0-9K]/g, '');

    if (valorRaw.includes('K')) {
      const posicionK = valorRaw.indexOf('K');
      if (posicionK !== valorRaw.length - 1) {
        valorRaw = valorRaw.replace(/K/g, '');
      }
    }

    if (valorRaw.length > 9) valorRaw = valorRaw.slice(0, 9);

    if (valorRaw.length < 2) {
      this.rutValue = valorRaw;
    } else {
      let cuerpo = valorRaw.slice(0, -1);
      let dv = valorRaw.slice(-1);
      cuerpo = cuerpo.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
      this.rutValue = `${cuerpo}-${dv}`;
    }
    event.target.value = this.rutValue;
  }

  togglePassword() {
    this.showPassword = !this.showPassword;
    this.passwordType = this.showPassword ? 'text' : 'password';
  }

  iniciarSesion() {
    this.router.navigate(['/home']);
  }

  irAlRegistro() {
    this.router.navigate(['/register']);
  }
}