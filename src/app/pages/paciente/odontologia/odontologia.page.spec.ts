import { ComponentFixture, TestBed } from '@angular/core/testing';
import { OdontologiaPage } from './odontologia.page';

describe('OdontologiaPage', () => {
  let component: OdontologiaPage;
  let fixture: ComponentFixture<OdontologiaPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(OdontologiaPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
