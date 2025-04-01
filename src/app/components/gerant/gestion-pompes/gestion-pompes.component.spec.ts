import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GestionPompesComponent } from './gestion-pompes.component';

describe('GestionPompesComponent', () => {
  let component: GestionPompesComponent;
  let fixture: ComponentFixture<GestionPompesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GestionPompesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GestionPompesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
