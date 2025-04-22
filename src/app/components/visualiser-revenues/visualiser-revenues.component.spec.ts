import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VisualiserRevenuesComponent } from './visualiser-revenues.component';

describe('VisualiserRevenuesComponent', () => {
  let component: VisualiserRevenuesComponent;
  let fixture: ComponentFixture<VisualiserRevenuesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VisualiserRevenuesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VisualiserRevenuesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
