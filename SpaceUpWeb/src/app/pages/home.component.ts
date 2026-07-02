import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { UsersService } from '../services/usuario.service';
import { UserDataService } from '../services/components/user-data.service';
import { TokenService } from '../services/token.service';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit, OnDestroy {
  adminNombre = 'Administrador';
  adminCodigo = '';
  adminFoto = 'https://cdn-icons-png.flaticon.com/512/149/149071.png';
  sidebarVisible = true;
  userId: number | null = null;
  private userDataSubscription?: Subscription;
  private routerSubscription?: Subscription;

  constructor(
    public router: Router,
    private usersService: UsersService,
    private userDataService: UserDataService,
    private tokenService: TokenService
  ) {}

  ngOnInit(): void {
    this.loadUserFromToken();
    this.subscribeToUserDataChanges();
    this.subscribeToRouterEvents();
  }

  ngOnDestroy(): void {
    if (this.userDataSubscription) {
      this.userDataSubscription.unsubscribe();
    }
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
  }

  subscribeToRouterEvents(): void {
    this.routerSubscription = this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      const contentElement = document.querySelector('.content');
      if (contentElement) {
        contentElement.scrollTop = 0;
      }
    });
  }

  subscribeToUserDataChanges(): void {
    this.userDataSubscription = this.userDataService.userData$.subscribe((userData) => {
      if (userData) {
        this.adminNombre = userData.nombre || this.adminNombre;
        this.adminCodigo = userData.codigo || '';
        if (userData.imagenPerfil) {
          this.adminFoto = userData.imagenPerfil;
        }
      }
    });
  }

  loadUserFromToken(): void {
    const userToken = this.tokenService.getUserFromToken();
    
    if (userToken && userToken.id) {
      this.userId = userToken.id;
      
      this.usersService.findOne(userToken.id).subscribe({
        next: (user) => {
          this.adminNombre = user.nombre || this.adminNombre;
          this.adminCodigo = user.codigo || '';
          if (user.imagenPerfil) {
            this.adminFoto = user.imagenPerfil;
          }
          this.userDataService.updateUserData(user);
        },
        error: (err) => {
          console.error('Error al cargar datos del usuario:', err);
          this.adminNombre = userToken.nombre || 'Administrador';
        }
      });
    }
  }

  toggleSidebar(): void {
    this.sidebarVisible = !this.sidebarVisible;
  }

  cerrarSesion(): void {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('usuario');
    this.router.navigate(['/login']);
  }
}