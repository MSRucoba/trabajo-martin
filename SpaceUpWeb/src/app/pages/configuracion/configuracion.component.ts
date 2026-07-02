import { Component, OnInit, ViewChild, ElementRef, OnDestroy } from '@angular/core';
import { LogsService } from '../../services/web/logs.service';
import { TokenService } from '../../services/token.service';
import { UsersService } from '../../services/usuario.service';
import { UserDataService } from '../../services/components/user-data.service';
import { LoaderService } from '../../services/components/loader.service';

@Component({
  selector: 'app-configuracion',
  templateUrl: './configuracion.component.html',
  styleUrls: ['./configuracion.component.css'],
})
export class ConfiguracionComponent implements OnInit, OnDestroy {
  @ViewChild('terminalBody', { static: false }) terminalBody!: ElementRef;
  @ViewChild('fileInput', { static: false }) fileInput!: ElementRef;

  usuario: any = {
    id: null,
    nombre: '',
    apellido: '',
    email: '',
    phone: '',
    imagenPerfil: null,
  };

  usuarioOriginal: any = {};
  editando = false;

  mostrarModalPassword = false;
  mostrarPasswordActual = false;
  mostrarPasswordNueva = false;
  mostrarPasswordConfirmar = false;
  guardandoPassword = false;

  passwordData = {
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  };

  logs: string[] = [];
  totalLogs = 0;
  lineasMostradas = 100;
  busqueda = '';
  cargando = false;
  autoRefresh = false;
  refreshInterval: any = null;

  constructor(
    private logsService: LogsService,
    private tokenService: TokenService,
    private usuariosService: UsersService,
    private userDataService: UserDataService,
    private loaderService: LoaderService
  ) { }

  ngOnInit(): void {
    this.loaderService.show();
    this.cargarUsuario();
    this.cargarLogs();
  }

  ngOnDestroy(): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  }

  cargarUsuario(): void {
    const userToken = this.tokenService.getUserFromToken();

    if (userToken && userToken.id) {
      this.usuariosService.findOne(userToken.id).subscribe({
        next: (response) => {
          this.usuario = {
            id: response.id,
            nombre: response.nombre || '',
            apellido: response.apellido || '',
            email: response.email || '',
            phone: response.phone || '',
            imagenPerfil: response.imagenPerfil || null,
          };
          this.usuarioOriginal = { ...this.usuario };
          
          this.loaderService.hideWithDelay(5000);
        },
        error: (err) => {
          console.error('Error al cargar usuario:', err);
          this.usuario = {
            id: userToken.id,
            nombre: userToken.nombre || 'Sin nombre',
            apellido: userToken.apellido || '',
            email: userToken.email || '',
            phone: '',
            imagenPerfil: null,
          };
          this.usuarioOriginal = { ...this.usuario };
          this.loaderService.hide();
        },
      });
    }
  }

  habilitarEdicion(): void {
    this.editando = true;
  }

  guardarCambios(): void {
    if (!this.usuario.id) {
      alert('Error: No se pudo identificar al usuario');
      return;
    }

    const datosActualizados = {
      email: this.usuario.email,
      phone: this.usuario.phone,
    };

    this.usuariosService.updateProfile(this.usuario.id, datosActualizados).subscribe({
      next: (response) => {
        this.editando = false;
        this.usuarioOriginal = { ...this.usuario };
        alert('Perfil actualizado correctamente');

        this.userDataService.updateUserData(this.usuario);
      },
      error: (err) => {
        console.error('Error al actualizar perfil:', err);
        alert(err.error?.message || 'Error al actualizar el perfil');
      },
    });
  }

  cancelarEdicion(): void {
    this.usuario = { ...this.usuarioOriginal };
    this.editando = false;
  }

  cambiarFoto(event: any): void {
    const file = event.target.files[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      alert('Por favor selecciona una imagen válida (JPG, PNG, GIF o WEBP)');
      return;
    }

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      alert('La imagen no debe superar los 5MB');
      return;
    }

    this.usuariosService.updateImage(this.usuario.id, file).subscribe({
      next: (response) => {
        this.usuario.imagenPerfil = response.url;
        this.usuarioOriginal.imagenPerfil = response.url;
        alert('Foto de perfil actualizada correctamente');

        this.userDataService.updateUserData(this.usuario);
      },
      error: (err) => {
        console.error('Error al actualizar imagen:', err);
        alert(err.error?.message || 'Error al actualizar la foto de perfil');
      },
    });
  }

  abrirModalPassword(): void {
    this.mostrarModalPassword = true;
    this.passwordData = {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    };
  }

  cerrarModalPassword(): void {
    this.mostrarModalPassword = false;
    this.mostrarPasswordActual = false;
    this.mostrarPasswordNueva = false;
    this.mostrarPasswordConfirmar = false;
  }

  cambiarPassword(): void {
    if (!this.passwordData.currentPassword) {
      alert('Ingresa tu contraseña actual');
      return;
    }

    if (!this.passwordData.newPassword) {
      alert('Ingresa la nueva contraseña');
      return;
    }

    if (this.passwordData.newPassword.length < 6) {
      alert('La nueva contraseña debe tener al menos 6 caracteres');
      return;
    }

    if (this.passwordData.newPassword !== this.passwordData.confirmPassword) {
      alert('Las contraseñas no coinciden');
      return;
    }

    this.guardandoPassword = true;

    this.usuariosService.updatePassword(this.usuario.id, {
      currentPassword: this.passwordData.currentPassword,
      newPassword: this.passwordData.newPassword,
    }).subscribe({
      next: (response) => {
        this.guardandoPassword = false;
        this.cerrarModalPassword();
        alert('Contraseña actualizada correctamente');
      },
      error: (err) => {
        this.guardandoPassword = false;
        console.error('Error al cambiar contraseña:', err);
        alert(err.error?.message || 'Error al cambiar la contraseña');
      },
    });
  }

  cargarLogs(): void {
    this.cargando = true;
    this.logsService.obtenerUltimosLogs(this.lineasMostradas).subscribe({
      next: (response) => {
        const data = response.data || response;
        this.logs = data.logs || [];
        this.totalLogs = data.total || 0;
        this.cargando = false;
        this.scrollToBottom();
      },
      error: (err) => {
        console.error('Error al cargar logs:', err);
        this.cargando = false;
      },
    });
  }

  buscarLogs(): void {
    if (!this.busqueda.trim()) {
      this.cargarLogs();
      return;
    }

    this.cargando = true;
    this.logsService.buscarEnLogs(this.busqueda).subscribe({
      next: (response) => {
        const data = response.data || response;
        this.logs = data.logs || [];
        this.totalLogs = data.total || 0;
        this.cargando = false;
      },
      error: (err) => {
        console.error('Error al buscar en logs:', err);
        this.cargando = false;
      },
    });
  }

  limpiarLogs(): void {
    if (confirm('¿Estás seguro de limpiar todos los logs?')) {
      this.logsService.limpiarLogs().subscribe({
        next: () => {
          this.logs = [];
          this.totalLogs = 0;
          alert('Logs limpiados correctamente');
        },
        error: (err) => console.error('Error al limpiar logs:', err),
      });
    }
  }

  toggleAutoRefresh(): void {
    this.autoRefresh = !this.autoRefresh;

    if (this.autoRefresh) {
      this.refreshInterval = setInterval(() => {
        this.cargarLogs();
      }, 5000);
    } else {
      if (this.refreshInterval) {
        clearInterval(this.refreshInterval);
        this.refreshInterval = null;
      }
    }
  }

  formatearLog(log: string): string {
    if (!log) return '';

    let formatted = log;

    if (log.includes('ERROR')) {
      formatted = `<span class="log-error">${log}</span>`;
    } else if (log.includes('WARN')) {
      formatted = `<span class="log-warn">${log}</span>`;
    } else if (log.includes('SELECT') || log.includes('INSERT') || log.includes('UPDATE') || log.includes('DELETE')) {
      formatted = `<span class="log-sql">${log}</span>`;
    } else if (log.includes('GET') || log.includes('POST') || log.includes('PUT') || log.includes('DELETE')) {
      formatted = `<span class="log-http">${log}</span>`;
    }

    if (this.busqueda && this.busqueda.trim()) {
      const regex = new RegExp(`(${this.busqueda})`, 'gi');
      formatted = formatted.replace(regex, '<mark>$1</mark>');
    }

    return formatted;
  }

  scrollToBottom(): void {
    setTimeout(() => {
      if (this.terminalBody) {
        const element = this.terminalBody.nativeElement;
        element.scrollTop = element.scrollHeight;
      }
    }, 100);
  }

  onClickCambiarFoto() {
    console.log('Click detectado en botón');
    if (this.fileInput && this.fileInput.nativeElement) {
      this.fileInput.nativeElement.click();
    }
  }
}