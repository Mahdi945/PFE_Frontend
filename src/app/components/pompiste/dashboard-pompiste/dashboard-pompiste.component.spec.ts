import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DashboardPompisteComponent } from './dashboard-pompiste.component';

describe('DashboardPompisteComponent', () => {
  let component: DashboardPompisteComponent;
  let fixture: ComponentFixture<DashboardPompisteComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardPompisteComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DashboardPompisteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
