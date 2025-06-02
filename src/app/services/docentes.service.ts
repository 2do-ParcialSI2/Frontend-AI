import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../enviroment';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class DocentesService {
  private apiUrl = environment.apiUrl + 'docentes/';

  constructor(private http: HttpClient, private authService: AuthService) { }

  registerDocente(docente: any): Observable<any> {
    return this.http.post(this.apiUrl, docente);
  }

  getDocentes(): Observable<any> {
    return this.http.get(this.apiUrl).pipe(
      map(response => {
        console.log('Respuesta del servicio de docentes:', response);
        return response;
      })
    );
  }

  updateDocente(id: number, docente: any): Observable<any> {
    return this.http.patch(this.apiUrl + `${id}/`, docente);
  }

  getDocente(id: number, docente: any): Observable<any> {
    return this.http.get(this.apiUrl + `${id}/`, docente);
  }

  deleteDocente(id: number): Observable<any> {
    return this.http.delete(this.apiUrl + `${id}/`);
  }

  getHorarioDocente(id: number, docente: any): Observable<any> {
    return this.http.get(this.apiUrl + `${id}/horarios/`, docente);
  }
}
