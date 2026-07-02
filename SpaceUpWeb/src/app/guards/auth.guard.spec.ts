import { TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { Router } from '@angular/router';
import { AuthGuard } from './auth.guard';
import { TokenService } from '../services/token.service';

describe('AuthGuard', () => {
  let guard: AuthGuard;
  let tokenServiceSpy: jasmine.SpyObj<TokenService>;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(() => {
    const tokenSpy = jasmine.createSpyObj('TokenService', ['getToken', 'isTokenExpired', 'getRoleFromToken', 'removeToken']);
    const rSpy = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      providers: [
        AuthGuard,
        { provide: TokenService, useValue: tokenSpy },
        { provide: Router, useValue: rSpy }
      ]
    });

    guard = TestBed.inject(AuthGuard);
    tokenServiceSpy = TestBed.inject(TokenService) as jasmine.SpyObj<TokenService>;
    routerSpy = TestBed.inject(Router) as jasmine.SpyObj<Router>;
  });

  it('should be created', () => {
    expect(guard).toBeTruthy();
  });

  it('should deny access if no token', () => {
    tokenServiceSpy.getToken.and.returnValue(null);
    const result = guard.canActivate({ data: {} } as any, {} as any);
    expect(result).toBeFalse();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/login']);
  });
});