import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PadresTutoresComponent } from './padres-tutores.component';

describe('PadresTutoresComponent', () => {
  let component: PadresTutoresComponent;
  let fixture: ComponentFixture<PadresTutoresComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PadresTutoresComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PadresTutoresComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
