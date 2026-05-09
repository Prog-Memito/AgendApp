import { Component } from '@angular/core';
import { Router } from '@angular/router'; // Importar el Router
import { IonContent, IonButton } from '@ionic/angular/standalone';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: true,
  imports: [IonContent, IonButton],
})
export class HomePage {
  
  constructor(private router: Router) {}

  irAlLogin() {
    this.router.navigate(['/login']); // Navega a la página de login
  }
}