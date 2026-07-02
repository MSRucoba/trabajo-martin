import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

// Angular Material
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';

// Guards e Interceptores
import { AuthGuard } from './guards/auth.guard';
import { AuthInterceptor } from './interceptors/auth.interceptor';

//Componentes para generar reserva
import { BotonReporteComponent } from './components/boton-reporte/boton-reporte.component';
import { ModalReportesComponent } from './components/modal-reportes/modal-reportes.component';

//Componente de Loader
import { LoaderComponent } from './components/loader/loader.component';

// Componentes principales
import { AppComponent } from './app.component';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { LoginComponent } from './auth/login/login.component';
import { HomeComponent } from './pages/home.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { EmpresaComponent } from './pages/empresas/empresas.component';
import { EstacionamientosComponent } from './pages/estacionamientos/estacionamientos.component';
import { UsuariosComponent } from './pages/usuarios/usuarios.component';
import { ReservasComponent } from './pages/reservas/reservas.component';
import { PagoComponent } from './pages/pagos/pago.component';
import { TipovehiServiciosComponent } from './pages/tipos-vehiculos-servicios/tipovehi-servicios.component';
import { ConfiguracionComponent } from './pages/configuracion/configuracion.component';

const routes: Routes = [
  { path: 'login', component: LoginComponent },

  {
    path: 'home',
    component: HomeComponent,
    canActivate: [AuthGuard],
    canActivateChild: [AuthGuard],  
    children: [
      { path: 'dashboard', component: DashboardComponent },
      { path: 'empresas', component: EmpresaComponent },
      { path: 'estacionamientos', component: EstacionamientosComponent },
      { path: 'usuarios', component: UsuariosComponent },
      { path: 'reservas', component: ReservasComponent },
      { path: 'pagos', component: PagoComponent },
      { path: 'tipos-vehiculos-servicios', component: TipovehiServiciosComponent },
      { path: 'configuracion', component: ConfiguracionComponent },
    ],
  },

  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: '**', redirectTo: 'home' },
];

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    HomeComponent,
    DashboardComponent,
    EmpresaComponent,
    EstacionamientosComponent,
    UsuariosComponent,
    ReservasComponent,
    TipovehiServiciosComponent,
    ConfiguracionComponent,
    LoaderComponent,
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule.forRoot(routes),
    BrowserAnimationsModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    PagoComponent,
    BotonReporteComponent,
    ModalReportesComponent,
  ],
  providers: [
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true,
    },
    AuthGuard,
    provideAnimationsAsync(),
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}