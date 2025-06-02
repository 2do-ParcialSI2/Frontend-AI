import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { Rol } from '../models/rol.model';
import { environment } from '../enviroment';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class RoleService {
  private apiUrl = environment.apiUrl + 'roles/';

  constructor(private http: HttpClient, private authService: AuthService) { }


  registerRol(rol: any): Observable<any> {
    return this.http.post(this.apiUrl, rol);
  }

  getRols(): Observable<any> {
    return this.http.get(this.apiUrl);
  }

  updateRol(id: number, rol: any): Observable<any> {
    return this.http.put(this.apiUrl + `${id}/`, rol);
  }

  getRol(id: number, rol: any): Observable<any> {
    return this.http.get(this.apiUrl + `${id}/`, rol);
  }

  deleteRol(id: number): Observable<any> {
    return this.http.delete(this.apiUrl + `${id}/`);
  }
}
