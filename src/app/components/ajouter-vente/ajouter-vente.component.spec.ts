import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AjouterVenteComponent } from './ajouter-vente.component';

describe('AjouterVenteComponent', () => {
  let component: AjouterVenteComponent;
  let fixture: ComponentFixture<AjouterVenteComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AjouterVenteComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AjouterVenteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
