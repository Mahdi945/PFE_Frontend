import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GestionTransactionsComponent } from './gestion-transactions.component';

describe('GestionTransactionsComponent', () => {
  let component: GestionTransactionsComponent;
  let fixture: ComponentFixture<GestionTransactionsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GestionTransactionsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(GestionTransactionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
