import { TestBed } from '@angular/core/testing';

import { GestionStockService } from './gestion-stock.service';

describe('GestionStockService', () => {
  let service: GestionStockService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GestionStockService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
