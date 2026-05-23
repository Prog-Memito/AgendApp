import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, NavController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { 
  chevronBackOutline, 
  informationCircleOutline, 
  calendarOutline, 
  timeOutline, 
  checkmarkOutline, 
  closeCircleOutline, 
  personOutline 
} from 'ionicons/icons';
// Conexión directa con tu archivo de servicio unificado
import { AuthService } from '../../../services/auth'; 

@Component({
  selector: 'app-gestion-disponibilidad',
  templateUrl: './gestion-disponibilidad.page.html',
  styleUrls: ['./gestion-disponibilidad.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class GestionDisponibilidadPage implements OnInit {

  private navCtrl = inject(NavController);
  private authService = inject(AuthService);

  // Controlador de ventana emergente para Horarios Contractuales
  isModalHorarioOpen = false;

  // Listas de datos para las iteraciones de la vista (*ngFor)
  listaMedicos: any[] = [];
  listaHorarios: any[] = [];

  // Filtros reactivos enlazados por [(ngModel)]
  medicoSeleccionado: any = null;
  fechaSeleccionada: string = '';
  fechaFormateadaTexto: string = '';

  // Modelo de datos para la asignación contractual de bloques horarios
  nuevaAgenda = {
    dia_semana: '',
    hora_ini: '',
    hora_ter: '',
    medico_run_med: ''
  };

  constructor() {
    // Registro de los iconos utilizados en el archivo HTML (Limpiado personAddOutline)
    addIcons({ 
      chevronBackOutline, 
      informationCircleOutline, 
      calendarOutline, 
      timeOutline, 
      checkmarkOutline, 
      closeCircleOutline, 
      personOutline 
    });
  }

  ngOnInit() {
    this.cargarMedicos();
  }

  
  volverAlDashboard() {
    // Te redirige de vuelta al Panel de Administración del SOME
    this.navCtrl.navigateBack('/personal-some'); 
  }


  abrirModalHorario(isOpen: boolean) {
    this.isModalHorarioOpen = isOpen;
    if (!isOpen) this.resetFormAgenda();
  }


  cargarMedicos() {
    this.authService.getMedicos().subscribe({
      next: (res: any) => {
        if (res) {
          this.listaMedicos = res.data ? res.data : res;
        }
      },
      error: (err) => console.error('Error al cargar nómina de médicos desde Oracle:', err)
    });
  }

  cargarAgenda() {
    if (this.medicoSeleccionado && this.fechaSeleccionada) {
      this.fechaFormateadaTexto = this.formatearFechaTexto(this.fechaSeleccionada);

      // Mapeo seguro con la clave primaria en mayúsculas de Oracle
      const runMedico = this.medicoSeleccionado.RUN_MED || this.medicoSeleccionado.run_med;

      this.authService.getGestionDisponibilidad(runMedico, this.fechaSeleccionada).subscribe({
        next: (res: any) => {
          if (res) {
            this.listaHorarios = res.data ? res.data : res;
          }
        },
        error: (err) => console.error('Error al mapear bloques horarios:', err)
      });
    }
  }

  cambiarEstadoSlot(slot: any) {
    if (slot.estado === 'tomado') return; // Bloqueo si la hora ya fue reservada por un paciente (no editable)
    slot.estado = slot.estado === 'disponible' ? 'bloqueado' : 'disponible';
  }

  guardarHorarioAgenda() {
    this.authService.configurarHorario(this.nuevaAgenda).subscribe({
      next: (res: any) => {
        alert('Jornada contractual guardada exitosamente.');
        this.abrirModalHorario(false);
        this.cargarAgenda(); // Refresca la grilla si el médico editado estaba en pantalla
      },
      error: (err) => alert('Error al asignar contrato: ' + (err.error?.message || err.message))
    });
  }

  formatearFechaTexto(fechaStr: string): string {
    const opciones: Intl.DateTimeFormatOptions = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
    const date = new Date(fechaStr + 'T00:00:00');
    const texto = date.toLocaleDateString('es-CL', opciones);
    return texto.charAt(0).toUpperCase() + texto.slice(1);
  }

  resetFormAgenda() {
    this.nuevaAgenda = { dia_semana: '', hora_ini: '', hora_ter: '', medico_run_med: '' };
  }
}