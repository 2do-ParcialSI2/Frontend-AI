import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2'
import { EstudiantesService } from '../../services/estudiantes.service';
import { CursosService } from '../../services/cursos.service';
import { PadresTutoresService } from '../../services/padres-tutores.service';
import { MatriculaService } from '../../services/matricula.service';
import { MateriasService } from '../../services/materias.service';
import { HorariosService } from '../../services/horarios.service';

@Component({
  selector: 'app-materias',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './materias.component.html',
  styleUrl: './materias.component.css'
})
export class MateriasComponent implements OnInit {
  Filtrados: any[] = []; // visibles según filtro  
  filtro: string = '';
  isModalRegisterOpen: boolean = false;
  isModalUpdateOpen: boolean = false;
  nombre = '';
  descripcion = '';
  materias: any[] = [];
  nombreUpdate!: string;
  descripcionUpdate!: string;
  idSelected!: number;

  constructor(
    private materiaService: MateriasService,
    private horarioService: HorariosService
  ) { }

  ngOnInit(): void {
    this.getAll();
  }

  activeRegisterForm() {
    this.limpiarFormulario();
    this.isModalRegisterOpen = true;
  }

  // Método para limpiar el formulario
  limpiarFormulario() {
    this.nombre = '';
    this.descripcion = '';
  }

  // Método principal para registrar 
  register() {
    if (!this.nombre || !this.descripcion) {
      Swal.fire({
        position: "center",
        icon: "error",
        title: "Todos los campos son obligatorios",
        showConfirmButton: false,
        timer: 2000
      });
      return;
    }

    Swal.fire({
      title: 'Registrando información...',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    const Data = {
      nombre: this.nombre,
      descripcion: this.descripcion,
    };

    this.materiaService.register(Data).subscribe({
      next: (resp: any) => {
        console.log(resp);
        Swal.close();

        const esExitoso = resp.id || (resp.data && resp.data.id) || resp.statusCode === 200 || resp.statusCode === 201;

        if (esExitoso) {
          this.getAll();
          Swal.fire({
            position: "center",
            icon: "success",
            title: "Registrado correctamente",
            showConfirmButton: false,
            timer: 2000
          });

          this.limpiarFormulario();

          setTimeout(() => {
            this.closeRegisterModal();
          }, 2100);
        } else {
          Swal.fire({
            position: "center",
            icon: "error",
            title: "Error al registrar",
            text: resp.message || "Verifica los datos ingresados",
            showConfirmButton: true
          });
        }
      },
      error: (error: any) => {
        console.log('Error al registrar:', error);
        Swal.fire({
          position: "center",
          icon: "error",
          title: "Error al registrar",
          text: error.error?.message || "Ocurrió un error en el servidor",
          showConfirmButton: true
        });
      }
    });
  }

  async obtenerCursosAsignados(materias: any[]): Promise<void> {
    for (const materia of materias) {
      try {
        const horarios = await this.horarioService.getPorMateria(materia.id, {}).toPromise();
        console.log(`Horarios completos para materia ${materia.id}:`, JSON.stringify(horarios, null, 2));

        // Crear un Map para agrupar los horarios por curso
        const cursoHorarios = new Map();

        if (Array.isArray(horarios)) {
          horarios.forEach((h: any) => {
            console.log(`Procesando horario:`, JSON.stringify(h, null, 2));

            if (!cursoHorarios.has(h.curso)) {
              cursoHorarios.set(h.curso, new Set());
            }

            // Usar el campo 'dia' en lugar de 'dia_semana'
            const diaFormateado = h.dia || 'Sin día';
            const horaInicio = h.hora_inicio || '00:00';
            const horaFin = h.hora_fin || '00:00';

            console.log('Valores formateados:', {
              diaFormateado,
              horaInicio,
              horaFin,
              curso: h.curso
            });

            cursoHorarios.get(h.curso).add(`${diaFormateado} ${horaInicio}-${horaFin}`);
          });
        } else {
          console.warn(`Los horarios para la materia ${materia.id} no son un array:`, horarios);
        }

        // Convertir el Map a un array de strings formateados
        const cursosConHorarios = Array.from(cursoHorarios.entries()).map(([curso, horarios]) => {
          const horariosArray = Array.from(horarios as Set<string>);
          return `${curso} (${horariosArray.join(', ')})`;
        });

        materia.cursos_asignados = cursosConHorarios.length > 0 ? cursosConHorarios.join(' | ') : 'Sin cursos asignados';
        console.log(`Cursos asignados para materia ${materia.id}:`, materia.cursos_asignados);

      } catch (error) {
        console.error(`Error al obtener horarios para materia ${materia.id}:`, error);
        materia.cursos_asignados = 'Sin cursos asignados';
      }
    }
  }

  getAll(): void {
    Swal.fire({
      title: 'Cargando data...',
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading()
    });

    this.materiaService.getAll().subscribe({
      next: async (resp: any) => {
        let materias: any[] = [];

        if (resp && Array.isArray(resp)) {
          materias = resp;
        } else if (resp && resp.data && Array.isArray(resp.data)) {
          materias = resp.data;
        } else {
          console.warn('Respuesta inesperada al obtener materias:', resp);
          Swal.fire({
            icon: 'warning',
            title: 'Advertencia',
            text: 'El formato de la respuesta del servidor no es el esperado.'
          });
          materias = [];
        }

        // Obtener los cursos asignados
        await this.obtenerCursosAsignados(materias);

        this.materias = materias;
        this.Filtrados = [...materias];

        Swal.fire({
          icon: 'success',
          title: 'Información cargada correctamente',
          timer: 1000,
          showConfirmButton: false
        });
      },
      error: (error: any) => {
        Swal.close();
        console.error('Error al obtener la data:', error);
        this.Filtrados = [];
        Swal.fire({
          icon: 'error',
          title: 'Error al cargar',
          text: 'No se pudieron cargar las materias. Por favor, intente nuevamente.'
        });
      }
    });
  }

  getGeneroTexto(genero: string | null): string {
    if (genero === 'F') return 'Femenino';
    if (genero === 'M') return 'Masculino';
    return 'No especificado';
  }

  buscar(): void {
    const termino = this.filtro.trim().toLowerCase();
    if (termino === '') {
      this.Filtrados = this.materias;
    } else {
      this.Filtrados = this.materias.filter(sub =>
        `${sub.nombre}`.toLowerCase().includes(termino)
      );
    }
  }

  openModalToUpdate(data: any) {
    this.isModalUpdateOpen = true;
    this.nombreUpdate = data.nombre;
    this.descripcionUpdate = data.descripcion;
    this.idSelected = data.id;
  }

  actualizar() {
    Swal.fire({
      title: 'Actualizando información...',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    let Data: any = {
      nombre: this.nombreUpdate,
      descripcion: this.descripcionUpdate,
    };
    console.log('Datos de actualización:', Data);

    this.materiaService.update(this.idSelected, Data).subscribe(
      {
        next: (resp: any) => {
          this.getAll();
          Swal.close();
          Swal.fire({
            position: "center",
            icon: "success",
            title: "Información actualizada correctamente",
            showConfirmButton: false,
            timer: 2000
          });
          setTimeout(() => {
            this.closeUpdateModal();
          }, 2100);
        },
        error: (error: any) => {
          console.log(error);
          Swal.fire({
            position: "center",
            icon: "error",
            title: "Error al actualizar los datos",
            text: error.error?.message || "Ocurrió un error en el servidor",
            showConfirmButton: true
          });
        }
      }
    );
  }

  delete(materia: any) {
    // Confirmación antes de eliminar
    Swal.fire({
      title: '¿Estás seguro?',
      text: `¿Deseas eliminar la materia ${materia.nombre}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        // Mostrar indicador de carga
        Swal.fire({
          title: 'Eliminando...',
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading();
          }
        });

        this.materiaService.delete(materia.id).subscribe({
          next: (resp: any) => {
            this.getAll();
            console.log(resp);
            Swal.fire({
              position: "center",
              icon: "success",
              title: "Eliminado correctamente",
              showConfirmButton: false,
              timer: 2000
            });
          },
          error: (error: any) => {
            console.log(error);

            Swal.fire({
              position: "center",
              icon: "error",
              title: "Error al eliminar",
              text: error.error?.message || "Ocurrió un error en el servidor",
              showConfirmButton: true
            });
          }
        });
      }
    });
  }

  closeRegisterModal() {
    this.isModalRegisterOpen = false;
  }

  closeUpdateModal() {
    this.isModalUpdateOpen = false;
  }
}
