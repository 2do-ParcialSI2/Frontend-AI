import { TestBed } from '@angular/core/testing';

import { PadresTutoresService } from './padres-tutores.service';

describe('PadresTutoresService', () => {
  let service: PadresTutoresService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PadresTutoresService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
