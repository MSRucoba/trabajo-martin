import { Component, OnInit } from '@angular/core';
import { startCanvasAnimation } from './login-bg-canvas';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { jwtDecode } from 'jwt-decode';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  user = { email: '', password: '' };
  error = '';
  hidePassword = true;

  constructor(private authService: AuthService, private router: Router) { }

  onLogin(): void {

    console.log("📌 EMAIL enviado:", this.user.email);
    console.log("📌 PASSWORD enviado:", this.user.password);

    this.authService.login(this.user).subscribe({
      next: (res) => {

        const token = res.token?.replace('Bearer ', '');

        if (!token) {
          this.error = 'Token no recibido';
          return;
        }

        localStorage.setItem('accessToken', token);

        try {
          const decoded: any = jwtDecode(token);
          const role = decoded.rol;

          if (role === 'ADMIN') {
            this.router.navigate(['/home']);
          } else {
            this.error = 'Acceso restringido: solo administradores.';
          }
        } catch (e) {
          console.error('Error al decodificar token:', e);
          this.error = 'Token inválido';
        }
      },
      error: (err) => {
        console.error('❌ ERROR AL CONECTAR /auth/login:', err);

        console.log("📌 BODY que se envió:", this.user);

        this.error = 'Credenciales incorrectas';
      }
    });
  }

  ngOnInit(): void {
    startCanvasAnimation();
  }
}
