import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
//Llama a la api 
import { Api } from '../../services/api';
//LLama al Sidebar lateral 
import { Sidebar } from '../../components/sidebar/sidebar';

@Component({
  selector: 'app-medicos',
  standalone: true,
  imports: [ Sidebar, CommonModule, FormsModule ],
  templateUrl: './medicos.html',
  styleUrl: './medicos.scss',
})

export class Medicos implements OnInit {

  private api = inject(Api);

  medicos: any[] = [];

  mostrarFormulario = false;

  nuevoRun = '';
  nuevoNombre = '';
  nuevoApellidoPat = '';
  nuevoApellidoMat = '';
  nuevoFechaNacimiento = '';
  nuevoSexo = '';

  ngOnInit() {
    this.cargarMedicos();
  }

  cargarMedicos() {
    this.api.obtenerMedicos().subscribe({
      next: (resp: any) => {
        this.medicos = resp;
        console.log(resp);
      },
      error: (err) => {
        console.error(err);
      }
    });
  }

  cambiarEstado(medico: any) {
    const nuevoEstado =
      medico.ESTADO === 'ACTIVO'
        ? 2
        : 1;
    this.api.cambiarEstado(
      medico.RUN_MED,
      nuevoEstado
    )
    .subscribe({
      next: () => {
        medico.ESTADO =
          nuevoEstado === 1
            ? 'ACTIVO'
            : 'INACTIVO';
      },
      error: (err) => {
        console.error('ERROR COMPLETO:', err);
        alert(JSON.stringify(err.error));
      }
    });
  }

  nuevoMedico() {
    this.mostrarFormulario = true;
  }

  formatearRun(event: any) {
  let valor = event.target.value;
  valor = valor.replace(/[^0-9kK]/g, '');
  // Máximo 9 caracteres sin formato
  // 8 números + dígito verificador
  valor = valor.substring(0, 9);

  if (valor.length <= 1) {
    this.nuevoRun = valor;
    return;
  }
  const dv = valor.slice(-1);
  let run = valor.slice(0, -1);
  run = run.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  this.nuevoRun = `${run}-${dv.toUpperCase()}`;
  }

  guardarMedico() {
    const formatoRun =
      /^\d{1,2}\.\d{3}\.\d{3}-[0-9K]$/;
    if (!formatoRun.test(this.nuevoRun)) {
      alert('RUN inválido');
      return;
    }
    const datos = {
      run: this.nuevoRun,
      nombre: this.nuevoNombre,
      apellidoPat: this.nuevoApellidoPat,
      apellidoMat: this.nuevoApellidoMat,
      fechaNacimiento: this.nuevoFechaNacimiento,
      sexo: this.nuevoSexo
    };

    this.api.crearMedico(datos).subscribe({
        next: () => {
          alert(
            'Médico creado correctamente'
          );
          this.mostrarFormulario = false;

          this.nuevoRun = '';
          this.nuevoNombre = '';
          this.nuevoApellidoPat = '';
          this.nuevoApellidoMat = '';
          this.nuevoFechaNacimiento = '';
          this.nuevoSexo = '';
          this.cargarMedicos();
        },
        error: (err) => {
          console.error(err);
          alert(
            'Error al crear médico'
          );
        }
      });
  }
}
