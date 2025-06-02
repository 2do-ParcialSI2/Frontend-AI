import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../enviroment';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class HorariosService {
  private apiUrl = environment.apiUrl + 'horarios/';

  constructor(private http: HttpClient, private authService: AuthService) { }

  register(horario: any): Observable<any> {
    return this.http.post(this.apiUrl, horario);
  }

  getAll(): Observable<any> {
    return this.http.get(this.apiUrl);
  }

  update(id: number, horario: any): Observable<any> {
    return this.http.patch(this.apiUrl + `${id}/`, horario);
  }

  get(id: number, horario: any): Observable<any> {
    return this.http.get(this.apiUrl + `${id}/`, horario);
  }

  delete(id: number): Observable<any> {
    return this.http.delete(this.apiUrl + `${id}/`);
  }

  getHorariosDiasSemanas(id: number, horario: any): Observable<any> {
    return this.http.get(this.apiUrl + `dias-semana/${id}/`, horario);
  }

  getPorDia(id: number, horario: any): Observable<any> {
    return this.http.get(this.apiUrl + `por-dia/${id}/`, horario);
  }

  getPorMateria(id: number, materia: any): Observable<any> {
    return this.http.get(this.apiUrl + `/por-materia/${id}/`, materia);
  }
}
