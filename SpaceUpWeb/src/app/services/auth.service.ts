import { environment } from '../../environments/environment';
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { TokenService } from './token.service';
import { tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = `${environment.apiUrl}/auth`;

  constructor(private https: HttpClient, private tokenService: TokenService) {}

  login(credentials: { email: string; password: string }) {
  return this.https.post<{ token: string }>(`${this.apiUrl}/login`, credentials).pipe(
    tap(response => {
      const rawToken = response.token?.replace('Bearer ', '');
      this.tokenService.saveToken(rawToken);
    })
  );
}

  logout() {
    this.tokenService.removeToken();
  }
}