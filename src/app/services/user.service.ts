import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from './auth.service';
import { Observable } from 'rxjs';
import { environment } from '../enviroment';
import { authInterceptor } from './auth.interceptor';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private apiUrl = environment.apiUrl + 'usuarios/';

  constructor(private http: HttpClient, private authService: AuthService) { }

  registerUser(user: any): Observable<any> {
    return this.http.post(this.apiUrl, user);
  }

  getUsers(): Observable<any> {
    return this.http.get(this.apiUrl);
  }

  updateUser(id: number, user: any): Observable<any> {
    return this.http.patch(this.apiUrl + `${id}/`, user);
  }

  getUser(id: number, user: any): Observable<any> {
    return this.http.get(this.apiUrl + `${id}/`, user);
  }

  deleteUser(id: number): Observable<any> {
    return this.http.delete(this.apiUrl + `${id}/`);
  }
}
