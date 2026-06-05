import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

//Llama a la api 
import { Api } from '../../services/api';
//LLama al Sidebar lateral 
import { Sidebar } from '../../components/sidebar/sidebar';

@Component({
  selector: 'app-pacientes',
  standalone: true,
  imports: [ Sidebar, CommonModule, FormsModule ],
  templateUrl: './pacientes.html',
  styleUrl: './pacientes.scss',
})
export class Pacientes implements OnInit {

  private api = inject(Api);
  private cdr = inject(ChangeDetectorRef);

  pacientes: any[] = [];

  mostrarFormulario = false;

  nuevoRun = '';
  nuevoNombre = '';
  nuevoApellidoPat = '';
  nuevoApellidoMat = '';
  nuevoFechaNacimiento = '';
  nuevoTelefono = '';
  nuevoSexo = '';
  nuevoDireccion = '';

  ngOnInit() {
    this.cargarPacientes();
  }

  cargarPacientes() {
    this.api.obtenerPacientes().subscribe({
      next: (resp: any) => {
        console.log(resp);
        this.pacientes = resp;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error(err);
      }
    });
  }

  cambiarEstadoPaciente(paciente: any) {
    const nuevoEstado =
      paciente.ESTADO === 'ACTIVO'
        ? 2
        : 1;
    this.api.cambiarEstadoPaciente(
      paciente.RUN_PAC,
      nuevoEstado
    )
    .subscribe({
      next: () => {
        paciente.ESTADO =
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

  nuevoPaciente() {
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

  guardarPaciente() {
    const formatoRun =
      /^\d{1,2}\.\d{3}\.\d{3}-[0-9K]$/;
    if (!formatoRun.test(this.nuevoRun)) {
      alert('RUN inválido');
      return;
    }
    if (this.nuevoTelefono.length !== 9) {
      alert('El teléfono debe tener 9 dígitos');
      return;
    }
    const datos = {
      run: this.nuevoRun,
      nombre: this.nuevoNombre,
      apellidoPat: this.nuevoApellidoPat,
      apellidoMat: this.nuevoApellidoMat,
      fechaNacimiento: this.nuevoFechaNacimiento,
      telefono: this.nuevoTelefono,
      sexo: this.nuevoSexo,
      direccion: this.nuevoDireccion
    };

    this.api.crearPaciente(datos).subscribe({
        next: () => {
          alert(
            'Paciente creado correctamente'
          );
          this.mostrarFormulario = false;

          this.nuevoRun = '';
          this.nuevoNombre = '';
          this.nuevoApellidoPat = '';
          this.nuevoApellidoMat = '';
          this.nuevoFechaNacimiento = '';
          this.nuevoTelefono = '';
          this.nuevoSexo = '';
          this.nuevoDireccion = '';
          this.cargarPacientes();
        },
        error: (err) => {
          console.error(err);
          alert(
            'Error al crear paciente'
          );
        }
      });
  }

//
  formatearTelefono(event: any) {
    let valor = event.target.value;
    // Permitir solamente números
    valor = valor.replace(/\D/g, '');
    // Máximo 9 dígitos
    valor = valor.substring(0, 9);
    this.nuevoTelefono = valor;
  }

}
