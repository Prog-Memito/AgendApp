import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { businessOutline, idCardOutline, timeOutline, eyeOutline, eyeOffOutline } from 'ionicons/icons';

@Component({
  selector: 'app-perfil',
  templateUrl: './perfil.page.html',
  styleUrls: ['./perfil.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class PerfilPage implements OnInit {

  editando: boolean = false;
  cambiandoPassword: boolean = false;

  // Estados para mostrar u ocultar el texto de las contraseñas
  verNuevaPassword: boolean = false;
  verConfirmarPassword: boolean = false;
  verActualPassword: boolean = false;

  constructor() {
    addIcons({ businessOutline, idCardOutline, timeOutline, eyeOutline, eyeOffOutline });
  }

  ngOnInit() {}

  activarEdicion() {
    this.editando = true;
  }

  cancelarEdicion() {
    this.editando = false;
    this.cambiandoPassword = false;
    this.resetOjos();
  }

  togglePasswordForm() {
    this.cambiandoPassword = !this.cambiandoPassword;
    this.resetOjos();
  }

  // Resetea los ojitos para que vuelvan a estar ocultos al cerrar o cambiar
  resetOjos() {
    this.verNuevaPassword = false;
    this.verConfirmarPassword = false;
    this.verActualPassword = false;
  }

  guardarCambios() {
    console.log('Enviando datos actualizados...');
    this.editando = false;
    this.cambiandoPassword = false;
    this.resetOjos();
  }
}