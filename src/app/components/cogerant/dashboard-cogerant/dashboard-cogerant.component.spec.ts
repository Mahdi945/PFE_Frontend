import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DashboardCogerantComponent } from './dashboard-cogerant.component';

describe('DashboardCogerantComponent', () => {
  let component: DashboardCogerantComponent;
  let fixture: ComponentFixture<DashboardCogerantComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardCogerantComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DashboardCogerantComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
