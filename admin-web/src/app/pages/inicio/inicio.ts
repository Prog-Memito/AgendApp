import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
//Llama a la api 
import { Api } from '../../services/api';
//LLama al Sidebar lateral 
import { Sidebar } from '../../components/sidebar/sidebar';

import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration } from 'chart.js';

@Component({
  selector: 'app-inicio',
  standalone: true,
  imports: [ CommonModule, Sidebar, BaseChartDirective ],
  templateUrl: './inicio.html',
  styleUrl: './inicio.scss',
})
export class Inicio implements OnInit {

  private api = inject(Api);
  private cdr = inject(ChangeDetectorRef);

  dashboard: any = {
    pacientes: {},
    medicos: {},
    horarios: {},
    diasMasAgendados: [],
    medicosMasSolicitados: [],
    serviciosMasSolicitados: []
  };

  diasChartData: ChartConfiguration<'bar'>['data'] = {
    labels: [],
    datasets: [
      {
        data: [],
        label: 'Reservas'
      }
    ]
  };

  medicosChartData: ChartConfiguration<'bar'>['data'] = {
    labels: [],
    datasets: [
      {
        data: [],
        label: 'Reservas'
      }
    ]
  };

  serviciosChartData: ChartConfiguration<'pie'>['data'] = {
    labels: [],
    datasets: [
      {
        data: []
      }
    ]
  };

  ngOnInit() {

  this.cargarDashboard();

}

cargarDashboard() {
    this.api.obtenerDashboard().subscribe({
      next: (resp: any) => {
        console.log(resp);
        this.dashboard = resp;
        this.cargarGraficos();
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error(err);
      }
    });
  }

cargarGraficos() {
    // Días más agendados
    this.diasChartData = {
      labels:
        this.dashboard.diasMasAgendados?.map(
          (d: any) => d.DIA
        ),
      datasets: [
        {
          data:
            this.dashboard.diasMasAgendados?.map(
              (d: any) => d.TOTAL
            ),
          label: 'Reservas'
        }
      ]
    };
    // Médicos más solicitados
    this.medicosChartData = {
      labels:
        this.dashboard.medicosMasSolicitados?.map(
          (m: any) => m.MEDICO
        ),
        datasets: [
          {
            data:
              this.dashboard.medicosMasSolicitados?.map(
                (m: any) => m.TOTAL
              ),

            label: 'Reservas'
          }
        ]
      };
    // Servicios más solicitados
    this.serviciosChartData = {
      labels:
        this.dashboard.serviciosMasSolicitados?.map(
          (s: any) => s.NOMB_SERV
        ),
        datasets: [
          {
            data:
              this.dashboard.serviciosMasSolicitados?.map(
                (s: any) => s.TOTAL
              )
          }
        ]
    };
}

}
