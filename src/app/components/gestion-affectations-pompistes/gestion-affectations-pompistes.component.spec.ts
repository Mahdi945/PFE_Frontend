import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GestionAffectationsPompistesComponent } from './gestion-affectations-pompistes.component';

describe('GestionAffectationsPompistesComponent', () => {
  let component: GestionAffectationsPompistesComponent;
  let fixture: ComponentFixture<GestionAffectationsPompistesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GestionAffectationsPompistesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GestionAffectationsPompistesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
