import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { Api } from '../../services/api';

//LLama al Sidebar lateral 
import { Sidebar } from '../../components/sidebar/sidebar';

@Component({
  selector: 'app-horarios',
  standalone: true,
  imports: [ Sidebar, CommonModule, FormsModule ],
  templateUrl: './horarios.html',
  styleUrl: './horarios.scss',
})
export class Horarios implements OnInit {

  private api = inject(Api);
  private cdr = inject(ChangeDetectorRef);

  medicos: any[] = [];

  medicoSeleccionado = '';
  fecha = '';
  horaInicio = '';
  horaFin = '';
  duracion = 30;

  ngOnInit() {
    this.cargarMedicos();
  }

  cargarMedicos() {
    this.api.obtenerMedicos()
      .subscribe((resp: any) => {
        this.medicos = resp;
        this.cdr.detectChanges();
      });
  }

  generarHorarios() {

  if (
    !this.medicoSeleccionado ||
    !this.fecha ||
    !this.horaInicio ||
    !this.horaFin
  ) {

    alert('Debe completar todos los campos');
    return;

  }

  const datos = {

    medico: this.medicoSeleccionado,
    fecha: this.fecha,
    horaInicio: this.horaInicio,
    horaFin: this.horaFin,
    duracion: this.duracion

  };

  this.api.generarHorarios(datos)
    .subscribe({
      next: (resp: any) => {
        alert(
          `Se generaron ${resp.horariosGenerados} horarios correctamente`
        );
      },
      error: (err) => {
        console.error(err);
        alert(
          'Error al generar los horarios'
        );
      }
    });
}
}
