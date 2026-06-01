import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
//Llama a la api 
import { Api } from '../../services/api';
//LLama al Sidebar lateral 
import { Sidebar } from '../../components/sidebar/sidebar';

@Component({
  selector: 'app-inicio',
  standalone: true,
  imports: [ CommonModule, Sidebar ],
  templateUrl: './inicio.html',
  styleUrl: './inicio.scss',
})
export class Inicio implements OnInit {

  private api = inject(Api);
  private cdr = inject(ChangeDetectorRef);

  totalCitas = 0;
  totalPacientes = 0;
  totalMedicos = 0;
  totalCancelaciones = 0;

  ngOnInit() {

  this.api.obtenerResumen()
  .subscribe({
    next: (data: any) => {

      console.log('DATOS RECIBIDOS:', data);

      this.totalCitas = data.TOTAL_CITAS;
      this.totalPacientes = data.TOTAL_PACIENTES;
      this.totalMedicos = data.TOTAL_MEDICOS;
      this.totalCancelaciones = data.TOTAL_CANCELACIONES;

      this.cdr.detectChanges();

    },
    error: (err) => {
      console.error(err);
    }
  });

}

  probar() {
    this.totalCitas = 999;
    this.totalPacientes = 888;
    this.totalMedicos = 777;
    this.totalCancelaciones = 666;
  }


}
