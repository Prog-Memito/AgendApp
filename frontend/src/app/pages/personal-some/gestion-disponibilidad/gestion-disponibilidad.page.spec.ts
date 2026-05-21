import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GestionDisponibilidadPage } from './gestion-disponibilidad.page';

describe('GestionDisponibilidadPage', () => {
  let component: GestionDisponibilidadPage;
  let fixture: ComponentFixture<GestionDisponibilidadPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(GestionDisponibilidadPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
