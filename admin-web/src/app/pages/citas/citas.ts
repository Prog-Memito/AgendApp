import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { Api } from '../../services/api';
import { Sidebar } from '../../components/sidebar/sidebar';

@Component({
  selector: 'app-citas',
  standalone: true,
  imports: [ Sidebar, CommonModule, FormsModule ],
  templateUrl: './citas.html',
  styleUrl: './citas.scss',
})
export class Citas implements OnInit {

  private api = inject(Api);
  private cdr = inject(ChangeDetectorRef);

  citas: any[] = [];

  filtroPaciente = '';
  filtroMedico = '';
  fechaFiltro = '';

  paginaActual = 1;
  registrosPorPagina = 10;

  ngOnInit() {
    this.buscarCitas();
  }

  //
  buscarCitas() {
  if (
    !this.filtroPaciente &&
    !this.filtroMedico &&
    !this.fechaFiltro
  ) {
    alert(
      'Debe ingresar al menos un filtro'
    );
    return;
  }
  this.paginaActual = 1;
  this.api.buscarCitas(
    this.filtroPaciente,
    this.filtroMedico,
    this.fechaFiltro
  )
  .subscribe({
    next: (resp: any) => {
      this.citas = resp;
    },
    error: (err) => {
      console.error(err);
    }
  });
}

  //
  actualizarEstado(cita: any) {
    this.api.actualizarEstadoCita(
      cita.ID_CITA,
      cita.ESTADO_CITA
    )
    .subscribe({
      next: () => {
        console.log(
          'Estado actualizado'
        );
      },
      error: (err) => {
        console.error(err);

        alert(
          'Error al actualizar estado'
        );
      }
    });
  }

  //
  get citasPaginadas() {
    const inicio =
      (this.paginaActual - 1)
      *
      this.registrosPorPagina;
    const fin =
      inicio
      +
      this.registrosPorPagina;
    return this.citas.slice(
      inicio,
      fin
    );
  }

  //
  get totalPaginas() {
    return Math.ceil(
      this.citas.length
      /
      this.registrosPorPagina
    );
  }

  //
  paginaSiguiente() {
    if (
      this.paginaActual <
      this.totalPaginas
    ) {
      this.paginaActual++;
    }
  }

  //
  paginaAnterior() {
    if (
      this.paginaActual > 1
    ) {
      this.paginaActual--;
    }
  }
}