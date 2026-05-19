import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { Router, RouterModule } from '@angular/router';
import { addIcons } from 'ionicons';
import { addOutline, calendarOutline, personOutline, chevronForwardOutline } from 'ionicons/icons';

// Firebase y HTTP
import { Auth, signOut } from '@angular/fire/auth';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-home-paciente',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, RouterModule]
})
export class InicioPage implements OnInit{

  // Inyección de servicios
  private router = inject(Router);
  private auth = inject(Auth);
  private http = inject(HttpClient);

  // Nueva variable para almacenar el nombre del paciente
  nombrePaciente: string = 'Cargando...';

  constructor() {
    addIcons({ 
      addOutline, 
      calendarOutline, 
      personOutline, 
      chevronForwardOutline 
    });
  }

  ngOnInit() {
    this.obtenerDatosPaciente();
  }

  async obtenerDatosPaciente() {
    // 1. Obtenemos el usuario actualmente logueado en Firebase
    const usuarioActual = this.auth.currentUser;

    if (usuarioActual) {
      const uid = usuarioActual.uid;

      // 2. Consultamos a tu API de Node el nombre usando el UID
      this.http.get<{success: boolean, nombre: string}>(`http://localhost:3000/api/datos-paciente/${uid}`)
        .subscribe({
          next: (res) => {
            if (res.success) {
              this.nombrePaciente = res.nombre;
            }
          },
          error: (err) => {
            console.error('Error al traer el nombre desde Oracle:', err);
            this.nombrePaciente = 'Paciente';
          }
        });
    } else {
      // Si por alguna razón no hay sesión, lo devolvemos al login por seguridad
      this.router.navigate(['/login']);
    }
  }

  // Navegación a Agendar horas
  irAAgendar() {
    console.log('Navegando a Agendar...');
    this.router.navigate(['/agendar']);
  }

  // Navegación a Perfil
  irAPerfil() {
    this.router.navigate(['/perfil']);
  }

  // Cierre de sesión real en Firebase
  async logout() {
    try {
      await signOut(this.auth);
      this.router.navigate(['/login']);
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  }

  // Navegación a Mis Horas
  irAMisHoras() { 
    console.log('Navegando a Mis Horas...');
    this.router.navigate(['/mis-horas']);
  }
}