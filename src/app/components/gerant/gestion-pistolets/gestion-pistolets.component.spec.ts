import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GestionPistoletsComponent } from './gestion-pistolets.component';

describe('GestionPistoletsComponent', () => {
  let component: GestionPistoletsComponent;
  let fixture: ComponentFixture<GestionPistoletsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GestionPistoletsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GestionPistoletsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
