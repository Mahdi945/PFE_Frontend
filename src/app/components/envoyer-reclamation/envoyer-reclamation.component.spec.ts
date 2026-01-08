import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EnvoyerReclamationComponent } from './envoyer-reclamation.component';

describe('EnvoyerReclamationComponent', () => {
  let component: EnvoyerReclamationComponent;
  let fixture: ComponentFixture<EnvoyerReclamationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EnvoyerReclamationComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(EnvoyerReclamationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
