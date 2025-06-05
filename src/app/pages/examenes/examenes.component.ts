import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SeguimientoService } from '../../services/seguimiento.service';
import { CursosService } from '../../services/cursos.service';
import Swal from 'sweetalert2';
import { firstValueFrom } from 'rxjs';

interface Estudiante {
  id: number;
  nombre: string;
  nota: number | undefined;
  observaciones?: string;
}

@Component({
  selector: 'app-examenes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './examenes.component.html',
  styleUrl: './examenes.component.css'
})
export class ExamenesComponent implements OnInit {
  cursos: any[] = [];
  estudiantes: Estudiante[] = [];
  examenes: any[] = [];
  cursoSeleccionado: number | null = null;
  materiaSeleccionada: number | null = null;
  tipoExamenSeleccionado: number | null = null;
  fechaSeleccionada: string = new Date().toISOString().split('T')[0];
  materiasDelCurso: any[] = [];
  tiposExamen: any[] = [];
  cargandoEstudiantes: boolean = false;
  registrandoExamenes: boolean = false;
  seguimientosMap: Map<number, number> = new Map(); // Mapa de estudiante_id -> seguimiento_id
  tituloExamen: string = '';
  descripcionExamen: string = '';
  trimestreSeleccionado: number = 1; // Por defecto primer trimestre


  estudiantesSinSeguimiento: any[] = [];

  constructor(
    private seguimientoService: SeguimientoService,
    private cursosService: CursosService
  ) { }

  ngOnInit(): void {
    this.cargarCursos();
    this.cargarTiposExamen();
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

  cargarTiposExamen(): void {
    this.seguimientoService.getAllTiposExamen().subscribe({
      next: (response) => {
        this.tiposExamen = response;
      },
      error: (error) => {
        console.error('Error al cargar tipos de examen:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudieron cargar los tipos de examen'
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

      // Filtrar seguimientos por materia y curso
      const seguimientosFiltrados = seguimientos!.filter((seg: any) =>
        seg.materia_curso === this.materiaSeleccionada
      );

      // Crear mapa de estudiante_id -> seguimiento_id
      this.seguimientosMap.clear();
      seguimientosFiltrados.forEach((seg: any) => {
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

  limpiarNotas(): void {
    this.estudiantes.forEach(est => {
      est.nota = undefined;
      est.observaciones = '';
    });
  }

  verHistorialExamenes(): void {
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

    this.seguimientoService.getAllExamenes().subscribe({
      next: (response) => {
        this.examenes = response;
        // Aquí podrías abrir un modal o mostrar de alguna manera el historial
        Swal.close();
      },
      error: (error) => {
        console.error('Error al cargar historial:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudo cargar el historial de exámenes'
        });
      }
    });
  }

  async registrarExamenes(): Promise<void> {
    if (!this.materiaSeleccionada || !this.estudiantes.length || !this.fechaSeleccionada || !this.trimestreSeleccionado) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Por favor, complete todos los campos requeridos'
      });
      return;
    }

    try {
      this.registrandoExamenes = true;
      Swal.fire({
        title: 'Registrando exámenes...',
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
      this.estudiantesSinSeguimiento = this.estudiantes
        .filter(est => est.nota !== undefined && est.nota !== null)
        .filter(est => !seguimientosMap.has(est.id));

      if (this.estudiantesSinSeguimiento.length > 0) {
        throw new Error(`Los siguientes estudiantes no tienen seguimiento activo para esta materia en el trimestre ${this.trimestreSeleccionado}: ${this.estudiantesSinSeguimiento.map(e => e.nombre).join(', ')}`);
      }

      // Registrar exámenes solo para estudiantes que tienen nota y seguimiento
      const promesasExamenes = this.estudiantes
        .filter(est => est.nota !== undefined && est.nota !== null)
        .map(async estudiante => {
          const seguimientoId = seguimientosMap.get(estudiante.id);
          if (!seguimientoId) {
            throw new Error(`No se encontró seguimiento para el estudiante ${estudiante.nombre} en el trimestre ${this.trimestreSeleccionado}`);
          }

          const examenData = {
            seguimiento: seguimientoId,
            tipo_examen: 1,
            fecha: this.fechaSeleccionada,
            nota_examen: estudiante.nota!,
            observaciones: `${this.tituloExamen}${this.descripcionExamen ? ' - ' + this.descripcionExamen : ''}`
          };

          console.log('Datos del examen a registrar:', {
            estudiante: estudiante.nombre,
            trimestre: this.trimestreSeleccionado,
            examenData
          });

          return firstValueFrom(this.seguimientoService.createExamen(examenData));
        });

      await Promise.all(promesasExamenes);

      this.registrandoExamenes = false;
      Swal.fire({
        icon: 'success',
        title: 'Éxito',
        text: 'Exámenes registrados correctamente',
        timer: 1500,
        showConfirmButton: false
      });

    } catch (error: any) {
      this.registrandoExamenes = false;
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: `Los siguientes estudiantes no puede rendir el examen porque no tiene matrícula activa: ${this.trimestreSeleccionado}: ${this.estudiantesSinSeguimiento.map(e => e.nombre).join(', ')}`
      });
    }
  }
}
