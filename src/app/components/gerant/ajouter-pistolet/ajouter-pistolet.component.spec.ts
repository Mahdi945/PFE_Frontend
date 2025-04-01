import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AjouterPistoletComponent } from './ajouter-pistolet.component';

describe('AjouterPistoletComponent', () => {
  let component: AjouterPistoletComponent;
  let fixture: ComponentFixture<AjouterPistoletComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AjouterPistoletComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AjouterPistoletComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
