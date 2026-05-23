import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  // Inyectamos el HttpClient para hacer peticiones HTTP
  private http = inject(HttpClient);

  // URL de mi servidor backend
  private urlApi = 'http://localhost:3000/api';

  constructor() { }

  // Valida si el RUN existe en la DB de Oracle (Pre-enrolamiento)
  validarPaciente(run: string) {
    return this.http.get<any>(`${this.urlApi}/validar-paciente/${run}`);
  }

  // Registra en Firebase y actualiza los datos en Oracle
  vincularPacienteOracle(datos: { email: string, run: string, firebaseUID: string }) {
    return this.http.post<any>(`${this.urlApi}/vincular-paciente`, datos);
  }

  // Verifica si el correo existe en PERS_SOME antes del Login
  verificarPersonal(email: string) {
    return this.http.post<any>(`${this.urlApi}/verificar-personal`, { email });
  }

  // Vincula el UID de Firebase a la tabla PERS_SOME
  vincularPersonalOracle(run: string, firebaseUID: string) {
    return this.http.post<any>(`${this.urlApi}/vincular-personal`, { run, firebaseUID });
  }

  // Obtiene el rol del usuario desde Oracle por su UID de Firebase
  obtenerRol(uid: string) {
    return this.http.get<any>(`${this.urlApi}/obtener-rol/${uid}`);
  }

  // =================================================================
  // 🩺 GESTIÓN DE MÉDICOS Y HORARIOS (CONEXIÓN DIRECTA CON INDEX.JS)
  // =================================================================
  
  // Forzamos el tipado <any[]> para que la grilla reconozca el arreglo de inmediato
  getMedicos(): Observable<any[]> {
    return this.http.get<any[]>(`${this.urlApi}/medicos`);
  }

  getGestionDisponibilidad(runMedico: string, fecha: string) {
    return this.http.get<any>(`${this.urlApi}/gestion-disponibilidad?runMedico=${runMedico}&fecha=${fecha}`);
  }

  registrarMedico(medico: any) {
    return this.http.post<any>(`${this.urlApi}/medicos`, medico);
  }

  configurarHorario(agenda: any) {
    return this.http.post<any>(`${this.urlApi}/agenda-medica`, agenda);
  }
}