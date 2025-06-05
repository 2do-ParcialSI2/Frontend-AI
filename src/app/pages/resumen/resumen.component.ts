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

interface Estudiante {
  id: number;
  nombre: string;
  asistencia?: boolean;
  seguimientoId?: number;
  resumen?: any;
  mostrarResumen?: boolean;
}

interface CursoConEstudiantesResponse {
  id: number;
  nombre: string;
  turno: string;
  estudiantes: EstudianteRaw[];
}

interface EstudianteRaw {
  id: number;
  first_name: string;
  last_name: string;
  genero: string;
  fecha_nacimiento: string;
  curso: {
    id: number;
    nombre: string;
    turno: string;
  };
}


@Component({
  selector: 'app-resumen',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './resumen.component.html',
  styleUrl: './resumen.component.css'
})
export class ResumenComponent implements OnInit {
  cursos: any[] = [];
  estudiantes: Estudiante[] = [];
  cursoSeleccionado: number | null = null;
  cargandoEstudiantes: boolean = false;

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

  onCursoChange() {
    if (this.cursoSeleccionado) {
      this.cursosService.getIdCursosConEstudiantes(this.cursoSeleccionado).subscribe((response: any) => {
        const estudiantesRaw = response.estudiantes;

        this.estudiantes = estudiantesRaw.map((est: any) => ({
          id: est.id,
          nombre: `${est.first_name} ${est.last_name}`,
          asistencia: false,
          mostrarResumen: false // propiedad auxiliar para mostrar u ocultar detalles
        }));

        this.estudiantes.forEach((est: Estudiante) => {
          this.seguimientoService.getResumenEstudiante(est.id).subscribe(resumen => {
            est.resumen = resumen;
          });
        });
      });
    } else {
      this.estudiantes = [];
    }
  }



  async onMateriaChange(): Promise<void> {
    if (this.cursoSeleccionado) {
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
        this.obtenerResumenEstudiantes();

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

  async obtenerResumenEstudiantes(): Promise<void> {
    for (const estudiante of this.estudiantes) {
      try {
        const resumen = await firstValueFrom(this.seguimientoService.getResumenEstudiante(estudiante.id));
        estudiante.resumen = resumen;
        console.log(`Resumen obtenido para ${estudiante.nombre}:`, resumen);
      } catch (error) {
        console.error(`Error al obtener resumen para ${estudiante.nombre}:`, error);
      }
    }
  }

}
