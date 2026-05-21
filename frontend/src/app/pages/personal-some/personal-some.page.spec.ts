import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PersonalSomePage } from './personal-some.page';

describe('PersonalSomePage', () => {
  let component: PersonalSomePage;
  let fixture: ComponentFixture<PersonalSomePage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(PersonalSomePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
