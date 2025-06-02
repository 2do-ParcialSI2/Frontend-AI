import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../enviroment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = environment.apiUrl

  constructor(private http: HttpClient) { }

  login(email: string, password: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}login/`, { email, password });
  }

  registroAdmin(email: string, password: string) {
    const usuarioDTO = {
      email,
      password
    };

    return this.http.post<any>(`${this.apiUrl}crear-admin/`, usuarioDTO);
  }
  private token: string | null = null;

  guardarToken(token: string) {
    this.token = token;
    localStorage.setItem('token', token);
  }

  obtenerToken(): string | null {
    return this.token || localStorage.getItem('token');
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('nombre');
    localStorage.removeItem('email');
    localStorage.removeItem('userId');
  }

  guardarDatosUsuario(nombre: string, email: string) {
    localStorage.setItem('nombre', nombre);
    localStorage.setItem('email', email);
  }

  obtenerEmail(): string {
    return localStorage.getItem('email') || '';
  }

  obtenerUsuarioId(): number {
    return Number(localStorage.getItem('userId')) || 1; // Valor por defecto 1 si no está establecido
  }
}
