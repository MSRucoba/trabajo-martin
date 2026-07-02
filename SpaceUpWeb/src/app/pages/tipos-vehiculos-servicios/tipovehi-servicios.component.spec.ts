import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TipovehiServiciosComponent } from './tipovehi-servicios.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';

describe('TipovehiServiciosComponent', () => {
  let component: TipovehiServiciosComponent;
  let fixture: ComponentFixture<TipovehiServiciosComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, RouterTestingModule],
      declarations: [TipovehiServiciosComponent],
      providers: [],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(TipovehiServiciosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
