import { TestBed } from '@angular/core/testing';

import { PompePistoletService } from './pompes-pistolets.service';

describe('PompesPistoletsService', () => {
  let service: PompePistoletService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PompePistoletService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
