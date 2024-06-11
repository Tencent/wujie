import { TestBed } from '@angular/core/testing';

import { NgxWujieService } from './wujie-angular.service';

describe('NgxWujieService', () => {
  let service: NgxWujieService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(NgxWujieService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
