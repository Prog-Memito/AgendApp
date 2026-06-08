import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

//Llama a la api 
import { Api } from '../../services/api';
//LLama al Sidebar lateral 
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

  ngOnInit() {
    this.cargarCitas();
  }

  //
  cargarCitas() {
    this.api.obtenerCitas().subscribe({
      next: (resp: any) => {
        this.citas = resp;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error(err);
      }
    });
  }

  //
  buscarCitas() {
  this.api.buscarCitas(
    this.filtroPaciente,
    this.filtroMedico,
    this.fechaFiltro
  ).subscribe({next: (resp: any) => {
      this.citas = resp;
    },
    error: (err) => {
      console.error(err);
    }
  });

}


  //
  filtroPaciente = '';
  filtroMedico = '';
  fechaFiltro = '';
  get citasFiltradas() {
  return this.citas.filter(cita => {
    const coincidePaciente =
      !this.filtroPaciente ||
      cita.RUN_PAC
        .toLowerCase()
        .includes(this.filtroPaciente.toLowerCase())

    const coincideMedico =
      !this.filtroMedico ||
      cita.RUN_MED
        .toLowerCase()
        .includes(this.filtroMedico.toLowerCase())

    const coincideFecha =
      !this.fechaFiltro ||
      cita.FECHA.substring(0, 10) === this.fechaFiltro;

    return (
      coincidePaciente &&
      coincideMedico &&
      coincideFecha
    );
  });
  }

}
