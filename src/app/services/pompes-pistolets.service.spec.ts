import { TestBed } from '@angular/core/testing';

import { PompesPistoletsService } from './pompes-pistolets.service';

describe('PompesPistoletsService', () => {
  let service: PompesPistoletsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PompesPistoletsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
