import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GestionPaimentsComponent } from './gestion-paiments.component';

describe('GestionPaimentsComponent', () => {
  let component: GestionPaimentsComponent;
  let fixture: ComponentFixture<GestionPaimentsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GestionPaimentsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(GestionPaimentsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
