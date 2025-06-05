import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SeguimientoService, Seguimiento, Asistencia } from '../../services/seguimiento.service';
import { CursosService } from '../../services/cursos.service';
import { firstValueFrom } from 'rxjs';
import Swal from 'sweetalert2';

interface Estudiante {
  id: number;
  nombre: string;
  asistencia?: boolean;
  seguimientoId?: number;
}

interface SeguimientoEstudiante {
  id: number;
  nota_trimestral: number;
  estudiante_nombre: string;
  estudiante_apellido: string;
  materia_nombre: string;
  curso_nombre: string;
  trimestre_nombre: string;
  docente_nombre: string;
  docente_apellido: string;
}

interface MateriaCurso {
  id: number;
  nombre: string;
}

@Component({
  selector: 'app-asistencias',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './asistencias.component.html',
  styleUrl: './asistencias.component.css'
})
export class AsistenciasComponent implements OnInit {
  cursos: any[] = [];
  estudiantes: Estudiante[] = [];
  asistencias: Asistencia[] = [];
  cursoSeleccionado: number | null = null;
  materiaSeleccionada: number | null = null;
  fechaSeleccionada: string = new Date().toISOString().split('T')[0];
  materiasDelCurso: any[] = [];
  cargandoEstudiantes: boolean = false;
  registrandoAsistencias: boolean = false;
  seguimientosMap: Map<number, number> = new Map();

  constructor(
    private seguimientoService: SeguimientoService,
    private cursosService: CursosService
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

  onCursoChange(): void {
    if (this.cursoSeleccionado) {
      this.cargarMateriasDelCurso();
      this.materiaSeleccionada = null;
      this.estudiantes = [];
    }
  }

  cargarMateriasDelCurso(): void {
    if (!this.cursoSeleccionado) return;

    this.cursosService.getDetalles(this.cursoSeleccionado).subscribe({
      next: (response) => {
        console.log('Respuesta de getDetalles:', response);
        this.materiasDelCurso = response.materias_docentes.map(md => ({
          id: md.id,
          nombre: md.materia_nombre
        }));
        console.log('Materias del curso procesadas:', this.materiasDelCurso);
      },
      error: (error) => {
        console.error('Error al cargar materias:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudieron cargar las materias del curso'
        });
      }
    });
  }

  async obtenerSeguimientos(): Promise<void> {
    if (!this.materiaSeleccionada || !this.cursoSeleccionado) return;

    try {
      const seguimientos = await firstValueFrom(this.seguimientoService.getAllSeguimientos());
      console.log('Seguimientos obtenidos:', seguimientos);

      // Filtrar seguimientos por materia y curso
      const seguimientosFiltrados = seguimientos.filter(seg =>
        seg.materia_curso === this.materiaSeleccionada
      );

      // Crear mapa de estudiante_id -> seguimiento_id
      this.seguimientosMap.clear();
      seguimientosFiltrados.forEach(seg => {
        this.seguimientosMap.set(seg.estudiante, seg.id);
      });

      console.log('Mapa de seguimientos:', Object.fromEntries(this.seguimientosMap));
    } catch (error) {
      console.error('Error al obtener seguimientos:', error);
    }
  }

  async onMateriaChange(): Promise<void> {
    if (this.cursoSeleccionado && this.materiaSeleccionada) {
      await this.obtenerSeguimientos();
      this.cargarEstudiantes();
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
      next: (response) => {
        console.log('Respuesta del servidor:', response);

        if (response && response.estudiantes && Array.isArray(response.estudiantes)) {
          this.estudiantes = response.estudiantes.map((est: any) => {
            // Construir el nombre completo del estudiante
            const firstName = est.first_name || '';
            const lastName = est.last_name || '';
            const nombreCompleto = `${firstName} ${lastName}`.trim();

            return {
              id: est.id || 0,
              nombre: nombreCompleto || 'Sin nombre',
              asistencia: false
            };
          });
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

  toggleAsistencia(estudiante: Estudiante): void {
    estudiante.asistencia = !estudiante.asistencia;
  }

  marcarTodosPresentes(): void {
    this.estudiantes.forEach(est => est.asistencia = true);
  }

  marcarTodosAusentes(): void {
    this.estudiantes.forEach(est => est.asistencia = false);
  }

  async registrarAsistencias(): Promise<void> {
    if (!this.materiaSeleccionada || !this.estudiantes.length || !this.fechaSeleccionada) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Por favor, seleccione una materia, estudiantes y fecha'
      });
      return;
    }

    try {
      this.registrandoAsistencias = true;
      Swal.fire({
        title: 'Registrando asistencias...',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      // Crear mapa de seguimientos para cada estudiante
      const seguimientosMap = new Map();

      // Obtener seguimientos para cada estudiante
      for (const estudiante of this.estudiantes) {
        console.log('Procesando estudiante:', estudiante.nombre);
        console.log('Materia seleccionada (ID):', this.materiaSeleccionada, 'tipo:', typeof this.materiaSeleccionada);
        console.log('Materias disponibles:', this.materiasDelCurso);

        // Obtener la materia actual
        const materiaActual = this.materiasDelCurso.find(m => Number(m.id) === Number(this.materiaSeleccionada));
        console.log('Búsqueda de materia:', {
          materiaSeleccionada: this.materiaSeleccionada,
          tipoMateriaSeleccionada: typeof this.materiaSeleccionada,
          materias: this.materiasDelCurso.map(m => ({
            id: m.id,
            tipoId: typeof m.id,
            nombre: m.nombre
          }))
        });

        if (!materiaActual) {
          console.error('No se encontró la materia con ID:', this.materiaSeleccionada);
          continue;
        }

        console.log('Materia actual encontrada:', materiaActual);

        const seguimientos = await firstValueFrom(this.seguimientoService.getSeguimientosPorEstudiante(estudiante.id));
        console.log('Seguimientos obtenidos para', estudiante.nombre, ':', seguimientos);

        // Intentar encontrar el seguimiento correcto
        let seguimientoEncontrado = null;
        for (const seg of seguimientos) {
          console.log('Analizando seguimiento:', seg);
          if (seg.materia_nombre && materiaActual.nombre) {
            console.log('Comparando:', {
              'seguimiento_materia': seg.materia_nombre,
              'materia_actual': materiaActual.nombre,
              'coinciden': seg.materia_nombre.toLowerCase().trim() === materiaActual.nombre.toLowerCase().trim()
            });
            if (seg.materia_nombre.toLowerCase().trim() === materiaActual.nombre.toLowerCase().trim()) {
              seguimientoEncontrado = seg;
              break;
            }
          }
        }

        if (seguimientoEncontrado) {
          console.log('Seguimiento encontrado:', seguimientoEncontrado);
          seguimientosMap.set(estudiante.id, seguimientoEncontrado.id);
        } else {
          console.log('No se encontró seguimiento para la materia:', materiaActual.nombre);
        }
      }

      // Verificar que todos los estudiantes tengan seguimiento para esta materia
      const estudiantesSinSeguimiento = this.estudiantes.filter(est => !seguimientosMap.has(est.id));
      if (estudiantesSinSeguimiento.length > 0) {
        throw new Error(`Los siguientes estudiantes no tienen seguimiento activo para esta materia: ${estudiantesSinSeguimiento.map(e => e.nombre).join(', ')}`);
      }

      // Registrar asistencias solo para estudiantes con seguimiento
      const promesasAsistencias = this.estudiantes.map(async (estudiante) => {
        const seguimientoId = seguimientosMap.get(estudiante.id);
        if (!seguimientoId) {
          throw new Error(`No se encontró seguimiento para el estudiante ${estudiante.nombre}`);
        }

        return firstValueFrom(this.seguimientoService.createAsistencia({
          seguimiento: seguimientoId,
          fecha: this.fechaSeleccionada,
          asistencia: !!estudiante.asistencia
        }));
      });

      await Promise.all(promesasAsistencias);

      this.registrandoAsistencias = false;
      Swal.fire({
        icon: 'success',
        title: 'Éxito',
        text: 'Asistencias registradas correctamente',
        timer: 1500,
        showConfirmButton: false
      });

    } catch (error: any) {
      console.error('Error en el proceso:', error);
      this.registrandoAsistencias = false;
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.message || 'Ocurrió un error al procesar los datos'
      });
    }
  }

  verHistorialAsistencias(): void {
    if (!this.materiaSeleccionada) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Por favor, seleccione una materia'
      });
      return;
    }

    Swal.fire({
      title: 'Cargando historial...',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    this.seguimientoService.getAllAsistencias().subscribe({
      next: (response) => {
        this.asistencias = response;
        // Aquí podrías abrir un modal o mostrar de alguna manera el historial
        Swal.close();
      },
      error: (error) => {
        console.error('Error al cargar historial:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudo cargar el historial de asistencias'
        });
      }
    });
  }
}
