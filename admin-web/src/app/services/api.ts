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

  crearMedico(datos: any) {
  return this.http.post(
    `${this.url}/medicos`,
    datos
  );
}

  generarHorarios(datos: any) {
  return this.http.post(
    `${this.url}/horarios/generar`,
    datos
  );
}

  cambiarEstado(run: string, estado: number) {
  return this.http.put(
    `${this.url}/medicos/estado/${run}`,
    {
      estado
    }
  );
}

obtenerPacientes() {
  return this.http.get(
    `${this.url}/pacientes`
  );
}

crearPaciente(datos: any) {
  return this.http.post(
    `${this.url}/pacientes`,
    datos
  );
}

cambiarEstadoPaciente(run: string, estado: number) {
  return this.http.put(
    `${this.url}/pacientes/estado/${run}`,
    {
      estado
    }
  );
}

}
