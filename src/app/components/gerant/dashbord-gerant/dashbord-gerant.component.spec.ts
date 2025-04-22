import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DashbordGerantComponent } from './dashbord-gerant.component';

describe('DashbordGerantComponent', () => {
  let component: DashbordGerantComponent;
  let fixture: ComponentFixture<DashbordGerantComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashbordGerantComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DashbordGerantComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
