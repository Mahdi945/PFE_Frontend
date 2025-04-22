import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SaisiePaiementComponent } from './saisie-paiement.component';

describe('SaisiePaiementComponent', () => {
  let component: SaisiePaiementComponent;
  let fixture: ComponentFixture<SaisiePaiementComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SaisiePaiementComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SaisiePaiementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
