import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WujieComponent } from './wujie.component';

describe('NgxWujieComponent', () => {
  let component: WujieComponent;
  let fixture: ComponentFixture<WujieComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ WujieComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(WujieComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
