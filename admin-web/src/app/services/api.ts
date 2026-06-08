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

  obtenerDashboard() {
  return this.http.get(
    `${this.url}/dashboard`
  );
}

  obtenerMedicos() {
  return this.http.get(
    `${this.url}/medicos`
  );
}

obtenerProfesiones() {
  return this.http.get(
    `${this.url}/profesiones`
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

obtenerCitas() {
  return this.http.get(
    `${this.url}/citas`
  );
}

buscarCitas(
  runPaciente: string,
  runMedico: string,
  fecha: string
) {
  return this.http.get(
    `${this.url}/citas/buscar`,
    {
      params: {
        runPaciente,
        runMedico,
        fecha
      }
    }
  );
}



}
