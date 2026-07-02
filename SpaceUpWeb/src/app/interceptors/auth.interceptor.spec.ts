import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { HTTP_INTERCEPTORS, HttpClient } from '@angular/common/http';
import { AuthInterceptor } from './auth.interceptor';
import { TokenService } from '../services/token.service';

describe('AuthInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let tokenServiceSpy: jasmine.SpyObj<TokenService>;

  beforeEach(() => {
    const tokenSpy = jasmine.createSpyObj('TokenService', ['getToken']);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        { provide: TokenService, useValue: tokenSpy },
        {
          provide: HTTP_INTERCEPTORS,
          useClass: AuthInterceptor,
          multi: true
        }
      ]
    });

    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
    tokenServiceSpy = TestBed.inject(TokenService) as jasmine.SpyObj<TokenService>;
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should add Authorization header when token exists', () => {
    tokenServiceSpy.getToken.and.returnValue('mockToken');

    http.get('/api/test').subscribe();

    const req = httpMock.expectOne('/api/test');
    expect(req.request.headers.get('Authorization')).toBe('Bearer mockToken');
  });

  it('should not add header when token is missing', () => {
    tokenServiceSpy.getToken.and.returnValue(null);

    http.get('/auth/login').subscribe();

    const req = httpMock.expectOne('/auth/login');
    expect(req.request.headers.has('Authorization')).toBeFalse();
  });
});