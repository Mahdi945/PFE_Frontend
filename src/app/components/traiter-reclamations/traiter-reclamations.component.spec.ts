import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TraiterReclamationsComponent } from './traiter-reclamations.component';

describe('TraiterReclamationsComponent', () => {
  let component: TraiterReclamationsComponent;
  let fixture: ComponentFixture<TraiterReclamationsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TraiterReclamationsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TraiterReclamationsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
