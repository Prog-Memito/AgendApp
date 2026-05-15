import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MisHorasPage } from './mis-horas.page';

describe('MisHorasPage', () => {
  let component: MisHorasPage;
  let fixture: ComponentFixture<MisHorasPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(MisHorasPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
