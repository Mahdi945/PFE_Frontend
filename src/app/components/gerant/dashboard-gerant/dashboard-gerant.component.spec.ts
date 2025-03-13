import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DashboardGerantComponent } from './dashboard-gerant.component';

describe('DashboardGerantComponent', () => {
  let component: DashboardGerantComponent;
  let fixture: ComponentFixture<DashboardGerantComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardGerantComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DashboardGerantComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
