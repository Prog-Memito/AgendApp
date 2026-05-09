import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
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
import { personAddOutline, eyeOutline, eyeOffOutline } from 'ionicons/icons';

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
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
export class RegisterPage implements OnInit {
  
  // Control de flujo (Paso 1: RUT | Paso 2: Email y Pass)
  paso: number = 1;
  
  // Variable que almacena el RUT formateado
  rutValue: string = '';

  // Variables para la visibilidad de la contraseña
  showPassword = false;
  passwordType = 'password';

  constructor(private router: Router) {
    // Agregamos los iconos de la persona y los del ojo para la contraseña
    addIcons({ personAddOutline, eyeOutline, eyeOffOutline });
  }

  ngOnInit() {}

  /**
   * Alterna la visibilidad de la contraseña entre texto y puntos
   */
  togglePassword() {
    this.showPassword = !this.showPassword;
    this.passwordType = this.showPassword ? 'text' : 'password';
  }

  /**
   * Formatea el RUT en tiempo real: xx.xxx.xxx-x
   * Bloquea cualquier letra que no sea K y valida su posición.
   */
  onRutInput(event: any) {
    // 1. Limpieza inicial: Solo números y K
    let valorRaw = event.target.value.toUpperCase().replace(/[^0-9K]/g, '');

    // 2. Validación de la 'K' (solo permitida al final)
    if (valorRaw.includes('K')) {
      const posicionK = valorRaw.indexOf('K');
      if (posicionK !== valorRaw.length - 1) {
        valorRaw = valorRaw.replace(/K/g, '');
      }
    }

    // 3. Limite de caracteres (máximo 9: 8 números + 1 DV)
    if (valorRaw.length > 9) {
      valorRaw = valorRaw.slice(0, 9);
    }

    // 4. Lógica de formateo visual
    if (valorRaw.length < 2) {
      this.rutValue = valorRaw;
    } else {
      let cuerpo = valorRaw.slice(0, -1);
      let dv = valorRaw.slice(-1);
      // Puntos de miles
      cuerpo = cuerpo.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
      this.rutValue = `${cuerpo}-${dv}`;
    }

    // 5. Sincronización forzada con el elemento HTML para evitar parpadeo de letras prohibidas
    event.target.value = this.rutValue;
  }

  /**
   * Cambia a la pantalla de Email y Contraseña
   */
  siguientePaso() {
    // Validación mínima para avanzar (RUT chileno tiene entre 11 y 12 caracteres con puntos/guion)
    if (this.rutValue.length >= 11) {
      this.paso = 2;
    } else {
      console.log('RUT incompleto');
    }
  }

  /**
   * Regresa a la pantalla del RUT
   */
  volverPaso() {
    this.paso = 1;
  }

  /**
   * Finaliza el registro
   */
  registrarUsuario() {
    console.log('Registrando con RUT:', this.rutValue);
    this.router.navigate(['/login']);
  }

  irAlLogin() {
    this.router.navigate(['/login']);
  }
}