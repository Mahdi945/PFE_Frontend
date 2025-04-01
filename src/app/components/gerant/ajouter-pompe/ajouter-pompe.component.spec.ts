import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AjouterPompeComponent } from './ajouter-pompe.component';

describe('AjouterPompeComponent', () => {
  let component: AjouterPompeComponent;
  let fixture: ComponentFixture<AjouterPompeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AjouterPompeComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AjouterPompeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
