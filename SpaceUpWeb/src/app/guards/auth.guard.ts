import { Injectable } from '@angular/core';
import {
  CanActivate,
  CanActivateChild,
  Router,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
} from '@angular/router';
import { TokenService } from '../services/token.service';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate, CanActivateChild {

  constructor(
    private router: Router,
    private tokenService: TokenService
  ) {}

  private validarAcceso(route: ActivatedRouteSnapshot): boolean {
    const token = this.tokenService.getToken();

    if (!token || this.tokenService.isTokenExpired()) {
      console.warn('Token ausente o expirado');
      this.tokenService.removeToken();
      this.router.navigate(['/login']);
      return false;
    }

    const expectedRole = route.data['role'];
    const role = this.tokenService.getRoleFromToken();

    if (expectedRole && role?.toUpperCase() !== expectedRole?.toUpperCase()) {
      console.warn(`Acceso denegado. Rol requerido: ${expectedRole}, rol actual: ${role}`);
      this.router.navigate(['/login']);
      return false;
    }

    return true;
  }

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    return this.validarAcceso(route);
  }

  canActivateChild(childRoute: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    return this.validarAcceso(childRoute);
  }
}