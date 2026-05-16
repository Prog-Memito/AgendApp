import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { businessOutline, idCardOutline, timeOutline, eyeOutline, eyeOffOutline, alertCircleOutline } from 'ionicons/icons';

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

  // Estados de visualización del ojo
  verNuevaPassword: boolean = false;
  verConfirmarPassword: boolean = false;
  verActualPassword: boolean = false;

  // Modelos para manejar y validar los datos ingresados
  emailUsuario: string = '521497885@paciente.cl';
  nuevaClave: string = '';
  confirmarClave: string = '';
  actualClave: string = '';

  constructor() {
    addIcons({ businessOutline, idCardOutline, timeOutline, eyeOutline, eyeOffOutline, alertCircleOutline });
  }

  ngOnInit() {}

  activarEdicion() {
    this.editando = true;
  }

  cancelarEdicion() {
    this.editando = false;
    this.cambiandoPassword = false;
    this.resetFormulario();
  }

  togglePasswordForm() {
    this.cambiandoPassword = !this.cambiandoPassword;
    this.resetFormulario();
  }

  // Limpia los valores y resetea los ojitos
  resetFormulario() {
    this.verNuevaPassword = false;
    this.verConfirmarPassword = false;
    this.verActualPassword = false;
    this.nuevaClave = '';
    this.confirmarClave = '';
    this.actualClave = '';
  }

  guardarCambios() {
    console.log('Datos listos para enviar al backend:', {
      email: this.emailUsuario,
      nuevaClave: this.cambiandoPassword ? this.nuevaClave : 'No se cambió',
      actualClave: this.actualClave
    });
    
    this.editando = false;
    this.cambiandoPassword = false;
    this.resetFormulario();
  }
}