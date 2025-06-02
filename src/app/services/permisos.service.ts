import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../enviroment';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class PermisosService {
  private apiUrl = environment.apiUrl + 'permisos/';

  constructor(private http: HttpClient, private authService: AuthService) { }

  register(estudiante: any): Observable<any> {
    return this.http.post(this.apiUrl, estudiante);
  }

  getAll(): Observable<any> {
    return this.http.get(this.apiUrl);
  }

  update(id: number, estudiante: any): Observable<any> {
    return this.http.patch(this.apiUrl + `${id}/`, estudiante);
  }

  get(id: number, estudiante: any): Observable<any> {
    return this.http.get(this.apiUrl + `${id}/`, estudiante);
  }

  delete(id: number): Observable<any> {
    return this.http.delete(this.apiUrl + `${id}/`);
  }

}
