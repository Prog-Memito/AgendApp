import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
//Llama a la api 
import { Api } from '../../services/api';
//LLama al Sidebar lateral 
import { Sidebar } from '../../components/sidebar/sidebar';

@Component({
  selector: 'app-some',
  standalone: true,
  imports: [ Sidebar, CommonModule, FormsModule ],
  templateUrl: './some.html',
  styleUrl: './some.scss',
})
export class Some implements OnInit {

  private api = inject(Api);
  private cdr = inject(ChangeDetectorRef);

  some: any[] = [];
  cargos: any[] = [];

  filtroRun = '';
  filtroNombre = '';

  paginaActual = 1;
  registrosPorPagina = 10;

  mostrarFormulario = false;

  nuevoRun = '';
  nuevoNombre = '';
  nuevoApellidoPat = '';
  nuevoApellidoMat = '';
  nuevoEmail = '';
  nuevoCargo = '';

  ngOnInit() {
    this.cargarPersonal();
    this.cargarCargo();
  }

  cargarPersonal() {
    this.api.obtenerSome().subscribe({
      next: (resp: any) => {
        this.some = resp;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error(err);
      }
    })
  }

  cargarCargo() {
    this.api.obtenerCargos().subscribe({
      next: (resp: any) => {
        this.cargos = resp;
      },
      error: (err) => {
        console.error(err);
      }
    })
  }

  nuevoPersonal() {
    this.mostrarFormulario = true;
  }

  formatearRun(event: any) {
    let valor = event.target.value;
    valor = valor.replace(/[^0-9kK]/g, '')

    valor = valor.substring(0, 9);

    if (valor.length <= 1) {
      this.nuevoRun = valor;
      return
    }
    const dv = valor.slice(-1);
    let run = valor.slice(0, -1);
    run = run.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    this.nuevoRun = `${run}-${dv.toUpperCase()}`;
  }

  guardarPersonal() {
    const formatoRun = /^\d{1,2}\.\d{3}\.\d{3}-[0-9K]$/;
    if (!formatoRun.test(this.nuevoRun)) {
      alert('Run inválido');
      return
    }
    const datos = {
      run: this.nuevoRun,
      nombre: this.nuevoNombre,
      apellidoPat: this.nuevoApellidoPat,
      apellidoMat: this.nuevoApellidoMat,
      email: this.nuevoEmail,
      cargo: this.nuevoCargo,
    };

    this.api.crearSome(datos).subscribe({
      next: () => {
        alert(
          'Personal creado correctamente'
        );
        this.mostrarFormulario = false;
        
        this.nuevoRun = '';
        this.nuevoNombre = '';
        this.nuevoApellidoPat = '';
        this.nuevoApellidoMat = '';
        this.nuevoEmail = '';
        this.nuevoCargo = '';
        this.cargarPersonal();
      },
      error: (err) => {
        console.error(err);
        alert(
          'Error al crear personal'
        );
      }
    });
  }

  //
  get personalFiltrados() {
    return this.some.filter(p => {
      const coincideRun =
        p.RUN_SOME
          .toLowerCase()
          .includes(
            this.filtroRun.toLowerCase()
          );
      const coincideNombre =
        p.NOMBRE_COMPLETO
          .toLowerCase()
          .includes(
            this.filtroNombre.toLowerCase()
          );
      return coincideRun && coincideNombre;
    });
  }

  //
  get personalPaginados() {
    const inicio =
      (this.paginaActual - 1)
      *
      this.registrosPorPagina;
    const fin =
      inicio
      +
      this.registrosPorPagina;
    return this.personalFiltrados.slice(
      inicio,
      fin
    );
  }

  //
  get totalPaginas() {
    return Math.ceil(
      this.personalFiltrados.length
      /
      this.registrosPorPagina
    );
  }

  //
  paginaSiguiente() {
    if (
      this.paginaActual
      <
      this.totalPaginas
    ) {
      this.paginaActual++;
    }
  }

  //
  paginaAnterior() {
    if (
      this.paginaActual
      >
      1
    ) {
      this.paginaActual--;
    }
  }

}
