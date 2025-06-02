import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, map, catchError, throwError } from 'rxjs';
import { environment } from '../enviroment';
import { AuthService } from './auth.service';

interface MateriaDocente {
  id: number;
  materia_id: number;
  materia_nombre: string;
  docente_id?: number;
  docente_nombre?: string;
  horarios: any[];
}

interface CursoDetalle {
  id: number;
  nombre: string;
  turno: string;
  materias_docentes: MateriaDocente[];
}

interface CursoMaterias {
  id: number;
  nombre: string;
  turno: string;
  materias: any[];
}

@Injectable({
  providedIn: 'root'
})
export class CursosService {
  private apiUrl = environment.apiUrl + 'cursos/';

  constructor(private http: HttpClient, private authService: AuthService) { }

  register(curso: any): Observable<any> {
    return this.http.post(this.apiUrl + 'cursos/', curso);
  }

  getCursos(): Observable<any> {
    return this.http.get(this.apiUrl + 'cursos/');
  }

  getAll(): Observable<any> {
    return this.http.get(this.apiUrl + 'cursos/').pipe(
      map(cursos => {
        if (Array.isArray(cursos)) {
          // Para cada curso, obtenemos sus detalles con materias
          const cursosConDetalles = cursos.map(curso => 
            this.getMaterias(curso.id).pipe(
              map(detalles => ({
                ...curso,
                materias: detalles.materias || []
              }))
            )
          );
          return Promise.all(cursosConDetalles.map(obs => obs.toPromise()));
        }
        return Promise.resolve([]);
      })
    );
  }

  update(id: number, curso: any): Observable<any> {
    return this.http.patch(this.apiUrl + `cursos/${id}/`, curso);
  }

  get(id: number): Observable<any> {
    return this.http.get(this.apiUrl + `cursos/${id}/`);
  }

  delete(id: number): Observable<any> {
    return this.http.delete(this.apiUrl + `cursos/${id}/`);
  }

  getTurnos(): Observable<any> {
    return this.http.get(this.apiUrl + 'turnos/');
  }

  getMaterias(cursoId: number): Observable<CursoMaterias> {
    return this.http.get<CursoMaterias>(this.apiUrl + `con-materias/${cursoId}`);
  }

  getDetalles(cursoId: number): Observable<CursoDetalle> {
    return this.http.get<CursoDetalle>(this.apiUrl + `asignar-materias/${cursoId}/`);
  }

  getMateriasConDocentes(cursoId: number): Observable<any> {
    return this.getDetalles(cursoId).pipe(
      catchError(error => {
        if (error.status === 500) {
          // Si falla, intentamos con getMaterias
          return this.getMaterias(cursoId).pipe(
            map(cursoMaterias => {
              // Convertimos la respuesta al formato de CursoDetalle
              return {
                id: cursoMaterias.id,
                nombre: cursoMaterias.nombre,
                turno: cursoMaterias.turno,
                materias_docentes: cursoMaterias.materias.map(materia => ({
                  id: materia.id,
                  materia_id: materia.id,
                  materia_nombre: materia.nombre,
                  docente_id: null,
                  docente_nombre: 'Sin asignar',
                  horarios: []
                }))
              };
            })
          );
        }
        // Si es otro tipo de error, lo propagamos
        return throwError(() => error);
      })
    );
  }

  modificarDetalles(cursoId: number, data: any) {
    return this.http.put(this.apiUrl + `asignar-materias/${cursoId}/`, data);
  }
  /**{
  "asignaciones": [
    {
      "materia_id": 0,
      "docente_id": 0,
      "horarios_ids": [
        0
      ]
    }
  ]
} */

  editarMaterias(cursoId: number, data: any) {
    return this.http.patch(this.apiUrl + `asignar-materias/${cursoId}/`, data);
  }


  asignarMaterias(cursoId: number, materias_ids: number[]): Observable<any> {
    return this.http.post(this.apiUrl + `cursos/${cursoId}/asignar-materias/`, { materias_ids });
  }
  /*   {
     "materias_ids": [1, 2, 3]  // IDs de las materias que quieres asignar
   } */

  asignarDocente(cursoId: number, materiaId: number, docenteId: number): Observable<any> {
    return this.http.post(this.apiUrl + `cursos/${cursoId}/asignar-docente/${materiaId}/`, { docente_id: docenteId });
  }/**   {
     "docente_id": 1  // ID del docente
   } */

  asignarHorario(cursoId: number, materiaId: number, horarios_ids: number[]): Observable<any> {
    return this.http.post(this.apiUrl + `cursos/${cursoId}/asignar-horarios/${materiaId}/`, { horarios_ids });
  }
  /**   {
     "horarios_ids": [1, 2]  // IDs de los horarios para esa materia
   } */

  deleteMateria(cursoId: number, materiaId: number): Observable<any> {
    return this.http.delete(this.apiUrl + `${cursoId}/eliminar-materia/${materiaId}/`);
  }
}
