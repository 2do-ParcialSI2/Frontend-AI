import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2'
import { EstudiantesService } from '../../services/estudiantes.service';
import { CursosService } from '../../services/cursos.service';
import { PadresTutoresService } from '../../services/padres-tutores.service';
import { SeguimientoService } from '../../services/seguimiento.service';

@Component({
  selector: 'app-estudiantes',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './estudiantes.component.html',
  styleUrl: './estudiantes.component.css'
})
export class EstudiantesComponent implements OnInit {
  estudiantesFiltrados: any[] = []; // visibles según filtro  
  filtro: string = '';
  isModalRegisterOpen: boolean = false;
  isModalUpdateOpen: boolean = false;
  email = '';
  password = '';
  firstName = '';
  lastName = '';
  genero = '';
  direccion = '';
  activo = true; // puede cambiarse con checkbox
  selectedCurso: number | null = null;
  selectedTutor: number | null = null;
  fechaNacimiento: Date | null = null;
  estudiantes: any[] = [];
  tutores: any[] = [];
  cursos: any[] = [];
  emailUpdate!: string;
  passwordUpdate: string = '';
  firstNameUpdate!: string;
  lastNameUpdate!: string;
  generoUpdate!: string;
  direccionUpdate!: string;
  selectedCursoUpdate!: number;
  selectedTutorUpdate!: number;
  fechaNacimientoUpdate!: string;
  activoUpdate: boolean = true;
  idSelected!: number;

  constructor(private estudiantesService: EstudiantesService, private cursosServices: CursosService, private tutoresService: PadresTutoresService, private seguimientoService: SeguimientoService) {
  }

  ngOnInit(): void {
    this.getAll();
    this.getTutores();
    this.getCursos();
  }

  activeRegisterForm() {
    this.limpiarFormulario();
    this.isModalRegisterOpen = true;
  }

  // Método para limpiar el formulario
  limpiarFormulario() {
    this.password = '';
    this.email = '';
    this.firstName = '';
    this.lastName = '';
    this.genero = '';
    this.activo = true;
    this.direccion = '';
    this.fechaNacimiento = null;
    this.selectedCurso = null;
    this.selectedTutor = null;
  }

  // Método principal para registrar 
  register() {
    if (!this.password || !this.email || !this.direccion || !this.firstName || !this.lastName || !this.genero || !this.fechaNacimiento || this.selectedCurso == null || this.selectedTutor == null) {
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
      password: this.password,
      email: this.email,
      first_name: this.firstName,
      last_name: this.lastName,
      genero: this.genero,
      activo: this.activo,
      direccion: this.direccion,
      fecha_nacimiento: this.fechaNacimiento, // ya en formato YYYY-MM-DD
      padre_tutor_id: this.selectedTutor,
      curso_id: this.selectedCurso,
      roles: ['ESTUDIANTE']
    };

    this.estudiantesService.register(Data).subscribe({
      next: (resp: any) => {
        console.log('estudiante', resp);
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
          // this.seguimientoService.createSeguimiento({
          //   materia_curso: 1,
          //   trimestre: 1,
          //   estudiante: resp.id
          // });

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

  getAll(): void {
    // Mostrar SweetAlert de carga
    Swal.fire({
      title: 'Cargando data...',
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading()
    });

    this.estudiantesService.getAll().subscribe({
      next: (resp: any) => {
        console.log(resp)
        Swal.close(); // Cerrar la alerta de carga

        let estudiantes: any[] = [];

        // Verifica si la respuesta viene anidada (por ejemplo { data: [...] }) o es directamente un array
        if (resp && Array.isArray(resp)) {
          estudiantes = resp;
        } else if (resp && resp.data && Array.isArray(resp.data)) {
          estudiantes = resp.data;
        } else {
          console.warn('Respuesta inesperada al obtener estudiantes:', resp);
          Swal.fire({
            icon: 'warning',
            title: 'Advertencia',
            text: 'El formato de la respuesta del servidor no es el esperado.'
          });
          estudiantes = [];
        }

        // Asignar los datos a ambos arrays
        this.estudiantes = estudiantes;
        this.estudiantesFiltrados = [...estudiantes];

        // Feedback positivo si deseas
        Swal.fire({
          icon: 'success',
          title: 'Información cargada correctamente',
          timer: 1000,
          showConfirmButton: false
        });
      },

      error: (error: any) => {
        Swal.close();

        console.error('Error al obtener la  data:', error);
        this.estudiantesFiltrados = [];

        Swal.fire({
          icon: 'error',
          title: 'Error al cargar',
          text: 'No se pudieron cargar los estudiantes. Por favor, intente nuevamente.'
        });
      }
    });
  }

  getTutores(): void {
    this.tutoresService.getAll().subscribe({
      next: (resp: any) => {
        console.log('Tutores cargados:', resp);
        let tutores: any[] = [];

        // Verifica si la respuesta viene anidada (por ejemplo { data: [...] }) o es directamente un array
        if (resp && Array.isArray(resp)) {
          tutores = resp;
        } else if (resp && resp.data && Array.isArray(resp.data)) {
          tutores = resp.data;
        } else {
          console.warn('Respuesta inesperada al obtener tutores:', resp);
          Swal.fire({
            icon: 'warning',
            title: 'Advertencia',
            text: 'El formato de la respuesta del servidor no es el esperado.'
          });
          tutores = [];
        }

        // Asignar los datos
        this.tutores = tutores;

        // Feedback positivo si deseas
        Swal.fire({
          icon: 'success',
          title: 'Información cargada correctamente',
          timer: 1000,
          showConfirmButton: false
        });
      },

      error: (error: any) => {
        Swal.close();

        console.error('Error al obtener la  data:', error);

        Swal.fire({
          icon: 'error',
          title: 'Error al cargar',
          text: 'No se pudieron cargar los tutores. Por favor, intente nuevamente.'
        });
      }
    });
  }

  getCursos(): void {
    this.cursosServices.getCursos().subscribe({
      next: (resp: any) => {
        console.log(resp)
        let cursos: any[] = [];

        // Verifica si la respuesta viene anidada (por ejemplo { data: [...] }) o es directamente un array
        if (resp && Array.isArray(resp)) {
          cursos = resp;
        } else if (resp && resp.data && Array.isArray(resp.data)) {
          cursos = resp.data;
        } else {
          console.warn('Respuesta inesperada al obtener cursos:', resp);
          Swal.fire({
            icon: 'warning',
            title: 'Advertencia',
            text: 'El formato de la respuesta del servidor no es el esperado.'
          });
          cursos = [];
        }

        // Asignar los datos
        this.cursos = cursos;
        console.log(this.cursos);
        // Feedback positivo si deseas
        Swal.fire({
          icon: 'success',
          title: 'Información cargada correctamente',
          timer: 1000,
          showConfirmButton: false
        });
      },

      error: (error: any) => {
        Swal.close();

        console.error('Error al obtener la  data:', error);

        Swal.fire({
          icon: 'error',
          title: 'Error al cargar',
          text: 'No se pudieron cargar los cursos. Por favor, intente nuevamente.'
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
      this.estudiantesFiltrados = this.estudiantes;
    } else {
      this.estudiantesFiltrados = this.estudiantes.filter(sub =>
        `${sub.first_name} ${sub.last_name}`.toLowerCase().includes(termino)
      );
    }
  }

  openModalToUpdate(estudiante: any) {
    this.isModalUpdateOpen = true;
    this.passwordUpdate = '';
    this.emailUpdate = estudiante.email;
    this.firstNameUpdate = estudiante.first_name;
    this.lastNameUpdate = estudiante.last_name;
    this.generoUpdate = estudiante.genero;
    this.direccionUpdate = estudiante.direccion;
    this.activoUpdate = estudiante.activo;
    this.fechaNacimientoUpdate = estudiante.fecha_nacimiento;
    this.idSelected = estudiante.id;
    this.selectedCursoUpdate = estudiante.curso?.id || null;
    this.selectedTutorUpdate = estudiante.padre_tutor?.id || null;

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
      email: this.emailUpdate,
      first_name: this.firstNameUpdate,
      last_name: this.lastNameUpdate,
      genero: this.generoUpdate,
      activo: this.activoUpdate,
      direccion: this.direccionUpdate,
      fecha_nacimiento: this.fechaNacimientoUpdate,
      padre_tutor_id: this.selectedTutorUpdate,
      curso_id: this.selectedCursoUpdate,
    };

    if (this.passwordUpdate && this.passwordUpdate.trim() !== '') {
      Data.password = this.passwordUpdate;
    }

    console.log('Datos de actualización:', Data);

    this.estudiantesService.update(this.idSelected, Data).subscribe(
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

  delete(estudiante: any) {
    // Confirmación antes de eliminar
    Swal.fire({
      title: '¿Estás seguro?',
      text: `¿Deseas eliminar al estudiante ${estudiante.nombre}?`,
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

        this.estudiantesService.delete(estudiante.id).subscribe({
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
