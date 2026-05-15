import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ControlMedicoPage } from './control-medico.page';

describe('ControlMedicoPage', () => {
  let component: ControlMedicoPage;
  let fixture: ComponentFixture<ControlMedicoPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(ControlMedicoPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
