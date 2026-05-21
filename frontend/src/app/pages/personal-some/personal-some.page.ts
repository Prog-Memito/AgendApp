import { Component, OnInit, inject } from '@angular/core'; // Agregamos inject
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, NavController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { 
  shieldCheckmark, calendarClearOutline, trendingUpOutline, 
  timeOutline, businessOutline, statsChartOutline, 
  pieChartOutline, peopleCircleOutline, appsOutline, 
  calendarOutline 
} from 'ionicons/icons';

// Importamos Auth para capturar los datos del usuario logueado
import { Auth } from '@angular/fire/auth';

@Component({
  selector: 'app-personal-some',
  templateUrl: './personal-some.page.html',
  styleUrls: ['./personal-some.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class PersonalSomePage implements OnInit {

  // Inyectamos NavController y Auth usando la sintaxis Standalone
  private navCtrl: NavController = inject(NavController);
  private auth: Auth = inject(Auth);

  // Variables de estado del componente
  correoUsuario: string = 'Cargando...';

  // Variables dinámicas para las tarjetas de estadísticas conectados a Oracle
  totalCitas: number = 0;
  tipoMasAgendado: string = 'N/A';
  citasTipo: number = 0;
  diaMasAgendado: string = 'N/A';
  citasDia: number = 0;
  boxMasUsado: string = 'N/A';
  citasBox: number = 0;

  constructor() {
    addIcons({ 
      shieldCheckmark, calendarClearOutline, trendingUpOutline, 
      timeOutline, businessOutline, statsChartOutline, 
      pieChartOutline, peopleCircleOutline, appsOutline, 
      calendarOutline 
    });
  }

  ngOnInit() {
    // Obtenemos el usuario que está actualmente con la sesión activa
    const usuarioActivo = this.auth.currentUser;
    
    if (usuarioActivo && usuarioActivo.email) {
      this.correoUsuario = usuarioActivo.email; // Guardamos el correo real
    } else {
      this.correoUsuario = 'Sin sesión activa';
    }

    // Consulta directa a tu servidor Express de Node para rellenar los cuadros
    fetch('http://localhost:3000/api/estadisticas-some')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          this.totalCitas = data.totalCitas;
          this.tipoMasAgendado = data.tipoMasAgendado;
          this.citasTipo = data.citasTipo;
          
          // Agregamos .trim() para limpiar los espacios fantasmas que agrega Oracle a los días
          this.diaMasAgendado = data.diaMasAgendado ? data.diaMasAgendado.trim() : 'N/A';
          
          this.citasDia = data.citasDia;
          this.boxMasUsado = data.boxMasUsado;
          this.citasBox = data.citasBox;
        }
      })
      .catch(err => console.error('Error cargando estadísticas en frontend:', err));
  }

  cerrarSesion() {
    // Opcional: puedes agregar un this.auth.signOut() aquí si quieres destruir el token de Firebase
    this.navCtrl.navigateRoot('/login');
  }

  // --- FUNCIÓN AGREGADA PARA ENLAZAR EL BOTÓN ---
  irAGestionarDisponibilidad() {
    this.navCtrl.navigateForward('/gestion-disponibilidad');
  }
}