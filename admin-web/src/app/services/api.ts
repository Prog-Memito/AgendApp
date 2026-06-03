import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class Api {

  private http = inject(HttpClient);

  private url = 'http://localhost:3000/api';

  obtenerRol(uid: string) {
    return this.http.get(
      `${this.url}/obtener-rol/${uid}`
    );
  }

  obtenerResumen() {
  return this.http.get(
    `${this.url}/dashboard/resumen`
  );
  }

  obtenerMedicos() {
  return this.http.get(
    `${this.url}/medicos`
  );
  }

  generarHorarios(datos: any) {
  return this.http.post(
    `${this.url}/horarios/generar`,
    datos
  );
  }

  
}
