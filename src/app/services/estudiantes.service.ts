import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, map, from, forkJoin, switchMap } from 'rxjs';
import { mergeMap } from 'rxjs/operators';
import { environment } from '../enviroment';
import { AuthService } from './auth.service';
import { SeguimientoService } from './seguimiento.service';
import { CursosService } from './cursos.service';

interface Estudiante {
  id: number;
  first_name: string;
  last_name: string;
  curso: number;
  tutor: number;
}

interface Materia {
  id: number;
  nombre: string;
}

interface MateriaResponse {
  materias: Materia[];
}

interface MateriaDocente {
  id: number;           // Este es el ID de materia_curso que necesitamos
  materia_id: number;
  materia_nombre: string;
  docente_id: number;
  docente_nombre: string;
  horarios: any[];
}

interface CursoMaterias {
  id: number;
  nombre: string;
  turno: string;
  materias_docentes: MateriaDocente[];
}

interface SeguimientoResponse {
  id: number;
  materia_curso: number;
  trimestre: number;
  estudiante: number;
}

@Injectable({
  providedIn: 'root'
})
export class EstudiantesService {
  private apiUrl = environment.apiUrl + 'estudiantes/';
  private cursosApiUrl = environment.apiUrl + 'cursos/';

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private seguimientoService: SeguimientoService,
    private cursosService: CursosService
  ) { }

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

  registrarEstudianteConSeguimientos(datosEstudiante: any): Observable<{
    estudiante: Estudiante;
    seguimientos: SeguimientoResponse[];
  }> {
    // Primero registramos al estudiante
    return this.http.post<Estudiante>(this.apiUrl, datosEstudiante).pipe(
      switchMap(estudiante => {
        // Obtenemos las materias_docentes del curso
        return this.http.get<CursoMaterias>(`${this.cursosApiUrl}cursos/asignar-materias/${estudiante.curso}/`).pipe(
          map(cursoData => ({
            estudiante,
            materiasCursoIds: cursoData.materias_docentes.map(md => md.id)
          }))
        );
      }),
      switchMap(({ estudiante, materiasCursoIds }) => {
        // Creamos un seguimiento por cada materia_curso
        const seguimientosPromises = materiasCursoIds.map(materiaId =>
          this.seguimientoService.createSeguimiento({
            materia_curso: materiaId,
            trimestre: 1, // Asumimos que empezamos con el primer trimestre
            estudiante: estudiante.id
          })
        );

        // Esperamos a que se creen todos los seguimientos
        return forkJoin(seguimientosPromises).pipe(
          map(seguimientos => ({
            estudiante,
            seguimientos
          }))
        );
      })
    );
  }
}
