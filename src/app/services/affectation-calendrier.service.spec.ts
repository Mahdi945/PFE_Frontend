import { TestBed } from '@angular/core/testing';

import { AffectationCalendrierService } from './affectation-calendrier.service';

describe('AffectationCalendrierService', () => {
  let service: AffectationCalendrierService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AffectationCalendrierService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
