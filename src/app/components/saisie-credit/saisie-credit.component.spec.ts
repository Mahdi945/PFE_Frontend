import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SaisieCreditComponent } from './saisie-credit.component';

describe('SaisieCreditComponent', () => {
  let component: SaisieCreditComponent;
  let fixture: ComponentFixture<SaisieCreditComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SaisieCreditComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SaisieCreditComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
