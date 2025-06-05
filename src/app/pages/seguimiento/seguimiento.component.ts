import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SeguimientoService, Seguimiento, Asistencia } from '../../services/seguimiento.service';
import { CursosService } from '../../services/cursos.service';
import { firstValueFrom } from 'rxjs';
import Swal from 'sweetalert2';
import { EstudiantesService } from '../../services/estudiantes.service';

interface Estudiante {
  id: number;
  nombre: string;
  asistencia?: boolean;
  seguimientoId?: number;
  seguimiento?: boolean;
}

interface MateriaDocente {
  id: number;
  materia_id: number;
  materia_nombre: string;
  docente_id?: number;
  docente_nombre?: string;
  horarios: any[];
}

@Component({
  selector: 'app-seguimiento',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './seguimiento.component.html',
  styleUrl: './seguimiento.component.css'
})
export class SeguimientoComponent implements OnInit {
  cursos: any[] = [];
  trimestres: any[] = [];
  materiasCursos: any[] = [];
  estudiantes: Estudiante[] = [];
  asistencias: Asistencia[] = [];
  materiasDelCurso: any[] = [];
  materiaSeleccionada: number | null = null;
  cursoSeleccionado: number | null = null;
  trimestreSeleccionada: number | null = null;
  fechaSeleccionada: string = new Date().toISOString().split('T')[0];
  trimestresDelCurso: any[] = [];
  cargandoEstudiantes: boolean = false;
  registrandoAsistencias: boolean = false;
  seguimientosMap: Map<number, number> = new Map();
  materiasCursoIds: number[] = [];

  constructor(
    private seguimientoService: SeguimientoService,
    private cursosService: CursosService,
    private estudiantesService: EstudiantesService
  ) { }

  ngOnInit(): void {
    this.cargarCursos();
  }

  cargarCursos(): void {
    Swal.fire({
      title: 'Cargando cursos...',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    this.cursosService.getCursosConEstudiantes().subscribe({
      next: (response) => {
        this.cursos = response;
        Swal.close();
      },
      error: (error) => {
        console.error('Error al cargar cursos:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudieron cargar los cursos'
        });
      }
    });
  }

  cargarMateriasDelCurso(): void {
    if (!this.cursoSeleccionado) return;

    this.cursosService.getDetalles(this.cursoSeleccionado).subscribe({
      next: (detalles) => {
        this.materiasDelCurso = detalles.materias_docentes.map(md => ({
          id: md.id,
          nombre: md.materia_nombre
        }));

        this.materiasCursoIds = detalles.materias_docentes.map(md => md.id);
        console.log('IDs de materia_curso obtenidos:', this.materiasCursoIds);
      },
      error: (error) => {
        console.error('Error al obtener detalles del curso:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudieron cargar las materias del curso'
        });
      }
    });
  }

  onCursoChange(): void {
    if (this.cursoSeleccionado) {
      this.cargarMateriasDelCurso();
      this.cargarEstudiantes();
    }
  }

  onTrimestreChange(): void {
    if (this.cursoSeleccionado) {
      this.cargarEstudiantes();
    }
  }

  async verificarSeguimientosEstudiante(estudiante: Estudiante): Promise<boolean> {
    try {
      const seguimientos = await firstValueFrom(this.seguimientoService.getSeguimientosPorEstudiante(estudiante.id));
      return seguimientos && seguimientos.length > 0;
    } catch (error) {
      console.error('Error al verificar seguimientos:', error);
      return false;
    }
  }

  cargarEstudiantes(): void {
    if (!this.cursoSeleccionado) return;

    this.cargandoEstudiantes = true;
    Swal.fire({
      title: 'Cargando estudiantes...',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    this.cursosService.getIdCursosConEstudiantes(this.cursoSeleccionado).subscribe({
      next: async (response) => {
        console.log('Respuesta del servidor:', response);

        if (response && response.estudiantes && Array.isArray(response.estudiantes)) {
          const estudiantesPromesas = response.estudiantes.map(async (est: any) => {
            const firstName = est.first_name || '';
            const lastName = est.last_name || '';
            const nombreCompleto = `${firstName} ${lastName}`.trim();

            const tieneSeguimientos = await this.verificarSeguimientosEstudiante(est);

            return {
              id: est.id || 0,
              nombre: nombreCompleto || 'Sin nombre',
              asistencia: false,
              seguimientoId: tieneSeguimientos ? 1 : undefined
            };
          });

          this.estudiantes = await Promise.all(estudiantesPromesas);
        } else {
          console.error('Formato de respuesta inesperado:', response);
          this.estudiantes = [];
        }

        console.log('Estudiantes procesados:', this.estudiantes);
        this.cargandoEstudiantes = false;
        Swal.close();
      },
      error: (error) => {
        console.error('Error al cargar estudiantes:', error);
        this.cargandoEstudiantes = false;
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudieron cargar los estudiantes'
        });
      }
    });
  }

  async toggleSeguimiento(estudiante: Estudiante): Promise<void> {
    if (!this.cursoSeleccionado || this.materiasCursoIds.length === 0) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Por favor, seleccione un curso y espere a que se carguen las materias'
      });
      return;
    }

    try {
      Swal.fire({
        title: 'Creando seguimientos...',
        text: 'Por favor espere mientras se crean los seguimientos',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      // Crear seguimientos para cada materia y cada trimestre
      const promesasSeguimientos = [];
      for (const materiaId of this.materiasCursoIds) {
        for (let trimestre = 1; trimestre <= 3; trimestre++) {
          promesasSeguimientos.push(
            firstValueFrom(this.seguimientoService.createSeguimiento({
              materia_curso: materiaId,
              trimestre: trimestre,
              estudiante: estudiante.id
            }))
          );
        }
      }

      await Promise.all(promesasSeguimientos);

      estudiante.seguimientoId = 1;

      Swal.fire({
        icon: 'success',
        title: 'Éxito',
        text: 'Seguimientos creados correctamente',
        timer: 1500,
        showConfirmButton: false
      });

    } catch (error) {
      console.error('Error al crear seguimientos:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudieron crear los seguimientos'
      });
    }
  }
}
