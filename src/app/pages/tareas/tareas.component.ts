import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SeguimientoService, Seguimiento, Tarea } from '../../services/seguimiento.service';
import { CursosService } from '../../services/cursos.service';
import { firstValueFrom } from 'rxjs';
import Swal from 'sweetalert2';

interface Estudiante {
  id: number;
  nombre: string;
  entregado: boolean;
  nota: number | undefined;
  observaciones: string;
}

@Component({
  selector: 'app-tareas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './tareas.component.html',
  styleUrl: './tareas.component.css'
})
export class TareasComponent implements OnInit {
  cursos: any[] = [];
  estudiantes: Estudiante[] = [];
  tareas: Tarea[] = [];
  cursoSeleccionado: number | null = null;
  materiaSeleccionada: number | null = null;
  fechaSeleccionada: string = new Date().toISOString().split('T')[0];
  tituloTarea: string = '';
  descripcionTarea: string = '';
  materiasDelCurso: any[] = [];
  cargandoEstudiantes: boolean = false;
  registrandoTareas: boolean = false;
  seguimientosMap: Map<number, number> = new Map();
  trimestreSeleccionado: number = 1; // Por defecto primer trimestre

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

    this.cursosService.getMaterias(this.cursoSeleccionado).subscribe({
      next: (response) => {
        this.materiasDelCurso = response.materias;
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

      const seguimientosFiltrados = seguimientos.filter(seg =>
        seg.materia_curso === this.materiaSeleccionada
      );

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
            const firstName = est.first_name || '';
            const lastName = est.last_name || '';
            const nombreCompleto = `${firstName} ${lastName}`.trim();

            return {
              id: est.id || 0,
              nombre: nombreCompleto || 'Sin nombre',
              entregado: false,
              nota: undefined,
              observaciones: ''
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

  toggleEntrega(estudiante: Estudiante): void {
    estudiante.entregado = !estudiante.entregado;
    if (!estudiante.entregado) {
      estudiante.nota = undefined;
      estudiante.observaciones = '';
    }
  }

  marcarTodosEntregados(): void {
    this.estudiantes.forEach(est => {
      est.entregado = true;
    });
  }

  limpiarNotas(): void {
    this.estudiantes.forEach(est => {
      est.entregado = false;
      est.nota = undefined;
      est.observaciones = '';
    });
  }

  verHistorialTareas(): void {
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

    this.seguimientoService.getAllTareas().subscribe({
      next: (response) => {
        this.tareas = response;
        // Aquí podrías abrir un modal o mostrar de alguna manera el historial
        Swal.close();
      },
      error: (error) => {
        console.error('Error al cargar historial:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudo cargar el historial de tareas'
        });
      }
    });
  }

  async registrarTareas(): Promise<void> {
    if (!this.materiaSeleccionada || !this.estudiantes.length || !this.fechaSeleccionada || !this.tituloTarea || !this.trimestreSeleccionado) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Por favor, complete todos los campos requeridos'
      });
      return;
    }

    try {
      this.registrandoTareas = true;
      Swal.fire({
        title: 'Registrando tareas...',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

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
        throw new Error(`No se encontró la materia seleccionada con ID: ${this.materiaSeleccionada}`);
      }

      console.log('Materia actual encontrada:', materiaActual);

      // Crear mapa de seguimientos para cada estudiante
      const seguimientosMap = new Map();

      // Obtener seguimientos para cada estudiante
      for (const estudiante of this.estudiantes) {
        console.log('Procesando estudiante:', estudiante.nombre);

        const seguimientos = await firstValueFrom(this.seguimientoService.getSeguimientosPorEstudiante(estudiante.id));
        console.log('Seguimientos obtenidos para', estudiante.nombre, ':', seguimientos);

        // Validar seguimiento usando el nuevo método
        const seguimientoId = await this.seguimientoService.validarSeguimientoParaMateria(
          seguimientos,
          materiaActual,
          this.trimestreSeleccionado
        );

        if (seguimientoId) {
          seguimientosMap.set(estudiante.id, seguimientoId);
        }
      }

      // Verificar que todos los estudiantes tengan seguimiento para esta materia y trimestre
      const estudiantesSinSeguimiento = this.estudiantes
        .filter(est => est.entregado && est.nota !== undefined)
        .filter(est => !seguimientosMap.has(est.id));

      if (estudiantesSinSeguimiento.length > 0) {
        throw new Error(`Los siguientes estudiantes no tienen seguimiento activo para esta materia en el trimestre ${this.trimestreSeleccionado}: ${estudiantesSinSeguimiento.map(e => e.nombre).join(', ')}`);
      }

      // Registrar tareas solo para estudiantes que entregaron y tienen seguimiento
      const promesasTareas = this.estudiantes
        .filter(est => est.entregado && est.nota !== undefined)
        .map(async estudiante => {
          const seguimientoId = seguimientosMap.get(estudiante.id);
          if (!seguimientoId) {
            throw new Error(`No se encontró seguimiento para el estudiante ${estudiante.nombre} en el trimestre ${this.trimestreSeleccionado}`);
          }

          const tareaData = {
            seguimiento: seguimientoId,
            fecha: this.fechaSeleccionada,
            nota_tarea: estudiante.nota!,
            titulo: this.tituloTarea,
            descripcion: this.descripcionTarea || ''
          };

          console.log('Datos de la tarea a registrar:', {
            estudiante: estudiante.nombre,
            trimestre: this.trimestreSeleccionado,
            tareaData
          });

          return firstValueFrom(this.seguimientoService.createTarea(tareaData));
        });

      await Promise.all(promesasTareas);

      this.registrandoTareas = false;
      Swal.fire({
        icon: 'success',
        title: 'Éxito',
        text: 'Tareas registradas correctamente',
        timer: 1500,
        showConfirmButton: false
      });

    } catch (error: any) {
      console.error('Error en el proceso:', error);
      this.registrandoTareas = false;
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.message || 'Ocurrió un error al registrar las tareas'
      });
    }
  }
}
