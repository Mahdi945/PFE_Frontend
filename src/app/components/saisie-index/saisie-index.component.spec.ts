import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SaisieIndexComponent } from './saisie-index.component';

describe('SaisieIndexComponent', () => {
  let component: SaisieIndexComponent;
  let fixture: ComponentFixture<SaisieIndexComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SaisieIndexComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SaisieIndexComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
