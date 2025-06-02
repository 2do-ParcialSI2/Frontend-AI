import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../enviroment';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class MateriasService {
  private apiUrl = environment.apiUrl + 'materias/';

  constructor(private http: HttpClient, private authService: AuthService) { }

  register(materia: any): Observable<any> {
    return this.http.post(this.apiUrl, materia);
  }

  getAll(): Observable<any> {
    return this.http.get(this.apiUrl);
  }

  update(id: number, materia: any): Observable<any> {
    return this.http.patch(this.apiUrl + `${id}/`, materia);
  }

  get(id: number, materia: any): Observable<any> {
    return this.http.get(this.apiUrl + `${id}/`, materia);
  }

  delete(id: number): Observable<any> {
    return this.http.delete(this.apiUrl + `${id}/`);
  }

  getCurso(id: number, materia: any): Observable<any> {
    return this.http.get(this.apiUrl + `/curso/${id}/`, materia);
  }
}
