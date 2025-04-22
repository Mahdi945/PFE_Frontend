import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DashboardCaissierComponent } from './dashboard-caissier.component';

describe('DashboardCaissierComponent', () => {
  let component: DashboardCaissierComponent;
  let fixture: ComponentFixture<DashboardCaissierComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardCaissierComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DashboardCaissierComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
