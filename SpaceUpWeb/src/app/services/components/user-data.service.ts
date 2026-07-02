import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class UserDataService {
    private userDataSubject = new BehaviorSubject<any>(this.getStoredUserData());
    public userData$: Observable<any> = this.userDataSubject.asObservable();

    private getStoredUserData(): any {
        const usuario = localStorage.getItem('usuario');
        if (usuario) {
            try {
                return JSON.parse(usuario);
            } catch (e) {
                return null;
            }
        }
        return null;
    }

    updateUserData(userData: any): void {
        const userInfo = {
            nombre: userData.nombre,
            codigo: userData.codigo || '',
            foto: userData.imagenPerfil
        };

        console.log('💾 Guardando en UserDataService:', userInfo);
        localStorage.setItem('usuario', JSON.stringify(userInfo));
        this.userDataSubject.next(userInfo);
    }

    getUserData(): any {
        return this.userDataSubject.value;
    }
}