import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EstacionamientosComponent } from './estacionamientos.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';

describe('EstacionamientosComponent', () => {
  let component: EstacionamientosComponent;
  let fixture: ComponentFixture<EstacionamientosComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, RouterTestingModule],
      declarations: [EstacionamientosComponent],
      providers: [],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(EstacionamientosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
