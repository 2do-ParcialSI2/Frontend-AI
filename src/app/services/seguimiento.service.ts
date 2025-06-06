import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, forkJoin } from 'rxjs';
import { environment } from '../enviroment';
import { AuthService } from './auth.service';

export interface Seguimiento {
  id: number;
  materia_curso: number;
  trimestre: number;
  estudiante: number;
  nota_trimestral: number;
  resumen_nota: string;
  total_asistencias: number;
  total_tareas: number;
  total_participaciones: number;
  total_examenes: number;
}

export interface Asistencia {
  id: number;
  seguimiento: number;
  fecha: string;
  asistencia: boolean;
  estudiante_nombre?: string;
}

export interface Tarea {
  id: number;
  seguimiento: number;
  fecha: string;
  nota_tarea: number;
  titulo: string;
  descripcion: string;
  estudiante_nombre?: string;
}

export interface Participacion {
  id: number;
  seguimiento: number;
  fecha_participacion: string;
  nota_participacion: number;
  descripcion: string;
  estudiante_nombre?: string;
}

export interface Examen {
  id: number;
  seguimiento: number;
  tipo_examen: number;
  fecha: string;
  nota_examen: number;
  observaciones: string;
  estudiante_nombre?: string;
}

export interface TipoExamen {
  id: number;
  nombre: string;
  descripcion: string;
}

@Injectable({
  providedIn: 'root'
})
export class SeguimientoService {
  private apiUrl = environment.apiUrl + 'seguimiento/';

  constructor(private http: HttpClient, private authService: AuthService) { }

  // 1. GESTIÓN DE ASISTENCIAS
  getAllAsistencias(): Observable<Asistencia[]> {
    return this.http.get<Asistencia[]>(`${this.apiUrl}asistencias/`);
  }

  createAsistencia(data: { seguimiento: number, fecha: string, asistencia: boolean }): Observable<Asistencia> {
    return this.http.post<Asistencia>(`${this.apiUrl}asistencias/`, data);
  }

  registroMasivoAsistencias(data: { seguimientos: number[], fecha: string, asistencias: boolean[] }): Observable<any> {
    return this.http.post(`${this.apiUrl}asistencias/registro_masivo/`, data);
  }

  getAsistencia(id: number): Observable<any> {
    return this.http.get(`${this.apiUrl}asistencias/${id}/`);
  }

  updateAsistenciaCompleta(id: number, data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}asistencias/${id}/`, data);
  }

  updateAsistenciaParcial(id: number, data: any): Observable<any> {
    return this.http.patch(`${this.apiUrl}asistencias/${id}/`, data);
  }

  deleteAsistencia(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}asistencias/${id}/`);
  }

  // 2. GESTIÓN DE EXÁMENES
  getAllExamenes(): Observable<Examen[]> {
    return this.http.get<Examen[]>(`${this.apiUrl}examenes/`);
  }

  createExamen(data: {
    seguimiento: number,
    tipo_examen: number,
    fecha: string,
    nota_examen: number,
    observaciones: string
  }): Observable<Examen> {
    return this.http.post<Examen>(`${this.apiUrl}examenes/`, data);
  }

  getExamenesProximos(): Observable<any> {
    return this.http.get(`${this.apiUrl}examenes/proximos/`);
  }

  getExamen(id: number): Observable<any> {
    return this.http.get(`${this.apiUrl}examenes/${id}/`);
  }

  updateExamenCompleto(id: number, data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}examenes/${id}/`, data);
  }

  updateExamenParcial(id: number, data: any): Observable<any> {
    return this.http.patch(`${this.apiUrl}examenes/${id}/`, data);
  }

  deleteExamen(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}examenes/${id}/`);
  }

  // 3. GESTIÓN DE PARTICIPACIONES
  getAllParticipaciones(): Observable<Participacion[]> {
    return this.http.get<Participacion[]>(`${this.apiUrl}participaciones/`);
  }

  createParticipacion(data: {
    seguimiento: number,
    fecha_participacion: string,
    nota_participacion: number,
    descripcion: string
  }): Observable<Participacion> {
    return this.http.post<Participacion>(`${this.apiUrl}participaciones/`, data);
  }

  getParticipacion(id: number): Observable<any> {
    return this.http.get(`${this.apiUrl}participaciones/${id}/`);
  }

  updateParticipacionCompleta(id: number, data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}participaciones/${id}/`, data);
  }

  updateParticipacionParcial(id: number, data: any): Observable<any> {
    return this.http.patch(`${this.apiUrl}participaciones/${id}/`, data);
  }

  deleteParticipacion(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}participaciones/${id}/`);
  }

  // 4. RESUMEN Y SEGUIMIENTO GENERAL
  getResumenEstudiante(estudianteId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}resumen-estudiante/${estudianteId}/`);
  }

  getAllSeguimientos(): Observable<Seguimiento[]> {
    return this.http.get<Seguimiento[]>(`${this.apiUrl}seguimientos/`);
  }

  createSeguimiento(data: {
    materia_curso: number,
    trimestre: number,
    estudiante: number
  }): Observable<Seguimiento> {
    return this.http.post<Seguimiento>(`${this.apiUrl}seguimientos/`, data);
  }

  getSeguimientosPorEstudiante(estudianteId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}seguimientos/por_estudiante/`, {
      params: { estudiante_id: estudianteId.toString() }
    });
  }

  predecirNota(estudianteId: number, materiaCursoId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}seguimientos/predecir-nota/${estudianteId}/${materiaCursoId}/`, {});
  }

  getSeguimiento(id: number): Observable<any> {
    return this.http.get(`${this.apiUrl}seguimientos/${id}/`);
  }

  updateSeguimientoCompleto(id: number, data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}seguimientos/${id}/`, data);
  }

  updateSeguimientoParcial(id: number, data: any): Observable<any> {
    return this.http.patch(`${this.apiUrl}seguimientos/${id}/`, data);
  }

  deleteSeguimiento(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}seguimientos/${id}/`);
  }

  calcularNotaSeguimiento(id: number): Observable<any> {
    return this.http.post(`${this.apiUrl}seguimientos/${id}/calcular-nota/`, {});
  }

  // 5. GESTIÓN DE TAREAS
  getAllTareas(): Observable<Tarea[]> {
    return this.http.get<Tarea[]>(`${this.apiUrl}tareas/`);
  }

  createTarea(data: {
    seguimiento: number,
    fecha: string,
    nota_tarea: number,
    titulo: string,
    descripcion: string
  }): Observable<Tarea> {
    return this.http.post<Tarea>(`${this.apiUrl}tareas/`, data);
  }

  getTareasPorSeguimiento(): Observable<any> {
    return this.http.get(`${this.apiUrl}tareas/por_seguimiento/`);
  }

  getTarea(id: number): Observable<any> {
    return this.http.get(`${this.apiUrl}tareas/${id}/`);
  }

  updateTareaCompleta(id: number, data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}tareas/${id}/`, data);
  }

  updateTareaParcial(id: number, data: any): Observable<any> {
    return this.http.patch(`${this.apiUrl}tareas/${id}/`, data);
  }

  deleteTarea(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}tareas/${id}/`);
  }

  // 6. TIPOS DE EXAMEN
  getAllTiposExamen(): Observable<TipoExamen[]> {
    return this.http.get<TipoExamen[]>(`${this.apiUrl}tipoexamen/`);
  }

  createTipoExamen(data: {
    nombre: string,
    descripcion: string
  }): Observable<any> {
    return this.http.post(`${this.apiUrl}tipoexamen/`, data);
  }

  getTipoExamen(id: number): Observable<any> {
    return this.http.get(`${this.apiUrl}tipoexamen/${id}/`);
  }

  updateTipoExamenCompleto(id: number, data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}tipoexamen/${id}/`, data);
  }

  updateTipoExamenParcial(id: number, data: any): Observable<any> {
    return this.http.patch(`${this.apiUrl}tipoexamen/${id}/`, data);
  }

  deleteTipoExamen(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}tipoexamen/${id}/`);
  }

  // 7. VERIFICACIÓN
  verificarMatricula(estudianteId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}verificar-matricula/${estudianteId}/`);
  }

  createSeguimientosPorTrimestre(estudiante_id: number, materia_curso_id: number): Observable<any> {
    // Crear array de promesas para los 3 trimestres
    const seguimientos = [1, 2, 3].map(trimestre => {
      const data = {
        materia_curso: materia_curso_id,
        trimestre: trimestre,
        estudiante: estudiante_id
      };
      console.log(`Creando seguimiento para trimestre ${trimestre}:`, data);
      return this.http.post(`${this.apiUrl}/seguimientos/`, data);
    });

    // Retornar un observable que emite cuando todos los seguimientos son creados
    return forkJoin(seguimientos);
  }

  async validarSeguimientoParaMateria(seguimientos: any[], materiaActual: any, trimestreActual: number): Promise<number | null> {
    console.log('Validando seguimiento para materia:', {
      seguimientos,
      materiaActual,
      trimestreActual
    });

    if (!seguimientos || !materiaActual || !materiaActual.nombre || !trimestreActual) {
      console.log('Datos insuficientes para validar seguimiento');
      return null;
    }

    // Buscar el seguimiento correcto (misma materia y mismo trimestre)
    for (const seg of seguimientos) {
      console.log('Analizando seguimiento:', seg);
      if (seg.materia_nombre && materiaActual.nombre) {
        const coincideMateria = seg.materia_nombre.toLowerCase().trim() === materiaActual.nombre.toLowerCase().trim();
        const coincideTrimestre = this.obtenerNumeroTrimestre(seg.trimestre_nombre) === trimestreActual;

        console.log('Comparando:', {
          'seguimiento_materia': seg.materia_nombre,
          'materia_actual': materiaActual.nombre,
          'coincide_materia': coincideMateria,
          'trimestre_seguimiento': seg.trimestre_nombre,
          'trimestre_actual': trimestreActual,
          'coincide_trimestre': coincideTrimestre
        });

        if (coincideMateria && coincideTrimestre) {
          console.log('Seguimiento encontrado:', seg);
          return seg.id;
        }
      }
    }

    console.log('No se encontró seguimiento para la materia y trimestre:', {
      materia: materiaActual.nombre,
      trimestre: trimestreActual
    });
    return null;
  }

  private obtenerNumeroTrimestre(nombreTrimestre: string): number {
    if (!nombreTrimestre) return 0;

    const trimestre = nombreTrimestre.toLowerCase().trim();
    if (trimestre.includes('primer')) return 1;
    if (trimestre.includes('segundo')) return 2;
    if (trimestre.includes('tercer')) return 3;
    return 0;
  }
}
