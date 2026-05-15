import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})

export class AuthService {
  //Injectamos el HttpClient para hacer peticiones HTTP
  private http = inject(HttpClient);

  //URl de mi servidor backend
  private urlApi = 'http://localhost:3000/api';

  constructor() { }

  //Valida si el run existe en la DB de Oracle
  validarPaciente(run: string) {
    return this.http.get<any>(`${this.urlApi}/validar-paciente/${run}`);
  }

  //Registra en Firebase, guardando el uiden Oracle
  vincularUsuarioOracle(datos: { email: string, run: string, firebaseUid: string }) {
    return this.http.post<any>(`${this.urlApi}/crear-usuario`, datos);
  }

  //Obtiene el roll del usuario desde Oracle por su UID de Firebase
  obtenerRol(uid: string) {
    return this.http.get<any>('${this.urlApi}/obtener-rol/${uid}');
  }
}
