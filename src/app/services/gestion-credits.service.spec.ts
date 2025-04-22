import { TestBed } from '@angular/core/testing';

import { GestionCreditsService } from './gestion-credits.service';

describe('GestionCreditsService', () => {
  let service: GestionCreditsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GestionCreditsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
