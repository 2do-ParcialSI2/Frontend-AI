import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../enviroment';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class PadresTutoresService {
  private apiUrl = environment.apiUrl + 'padres-tutores/';
  constructor(private http: HttpClient, private authService: AuthService) { }

  register(tutor: any): Observable<any> {
    return this.http.post(this.apiUrl, tutor);
  }

  getAll(): Observable<any> {
    return this.http.get(this.apiUrl);
  }

  update(id: number, tutor: any): Observable<any> {
    return this.http.patch(this.apiUrl + `${id}/`, tutor);
  }

  get(id: number, tutor: any): Observable<any> {
    return this.http.get(this.apiUrl + `${id}/`, tutor);
  }

  delete(id: number): Observable<any> {
    return this.http.delete(this.apiUrl + `${id}/`);
  }

}
