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

  // Variable para almacenar el correo dinámico
  correoUsuario: string = 'Cargando...';

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
      this.correoUsuario = usuarioActivo.email; // Guardamos el correo real (ej: ignacio.gonzalez@cesfam.cl)
    } else {
      this.correoUsuario = 'Sin sesión activa';
    }
  }

  cerrarSesion() {
    // Opcional: puedes agregar un this.auth.signOut() aquí si quieres destruir el token de Firebase
    this.navCtrl.navigateRoot('/login');
  }
}