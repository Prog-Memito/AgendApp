import { Component, inject } from '@angular/core';
import { RouterModule, Router } from '@angular/router';

import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [ RouterModule ],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss',
})
export class Sidebar {

  private authService = inject(AuthService);
  private router = inject(Router);

  async logout() {
    try {
      await this.authService.logout();
      localStorage.clear();
      this.router.navigate(['/login']);
    } catch(error) {
      console.error(error);
      alert('Error al cerrar sesión');
    }
  }

}

