import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2'
import { DocentesService } from '../../services/docentes.service';

@Component({
  selector: 'app-docentes',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './docentes.component.html',
  styleUrl: './docentes.component.css'
})
export class DocentesComponent implements OnInit {
  docentesFiltrados: any[] = []; // visibles según filtro  
  filtro: string = '';
  isModalRegisterOpen: boolean = false;
  isModalUpdateOpen: boolean = false;
  email = '';
  password = '';
  firstName = '';
  lastName = '';
  genero = '';
  especialidad = '';
  activo = true; // puede cambiarse con checkbox
  docentes: any[] = [];
  emailUpdate!: string;
  passwordUpdate: string = '';
  firstNameUpdate!: string;
  lastNameUpdate!: string;
  generoUpdate!: string;
  especialidadUpdate!: string;
  activoUpdate: boolean = true;
  idSelected!: number;

  constructor(private docentesService: DocentesService) {
  }

  ngOnInit(): void {
    this.getDocentes();
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
    this.especialidad = '';
  }

  // Método principal para registrar 
  registerDocente() {
    if (!this.password || !this.email || !this.especialidad || !this.firstName || !this.lastName || !this.genero) {
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
      title: 'Registrando docente...',
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
      especialidad: this.especialidad,
    };

    this.docentesService.registerDocente(Data).subscribe({
      next: (resp: any) => {
        console.log(resp);
        Swal.close();

        const esExitoso = resp.id || (resp.data && resp.data.id) || resp.statusCode === 200 || resp.statusCode === 201;

        if (esExitoso) {
          this.getDocentes();
          Swal.fire({
            position: "center",
            icon: "success",
            title: "Usuario registrado correctamente",
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
            title: "Error al registrar el docente",
            text: resp.message || "Verifica los datos ingresados",
            showConfirmButton: true
          });
        }
      },
      error: (error: any) => {
        console.log('Error al registrar docente:', error);
        Swal.fire({
          position: "center",
          icon: "error",
          title: "Error al registrar el docente",
          text: error.error?.message || "Ocurrió un error en el servidor",
          showConfirmButton: true
        });
      }
    });
  }


  getDocentes(): void {
    // Mostrar SweetAlert de carga
    Swal.fire({
      title: 'Cargando docentes...',
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading()
    });

    this.docentesService.getDocentes().subscribe({
      next: (resp: any) => {
        console.log(resp)
        Swal.close(); // Cerrar la alerta de carga

        let docentes: any[] = [];

        // Verifica si la respuesta viene anidada (por ejemplo { data: [...] }) o es directamente un array
        if (resp && Array.isArray(resp)) {
          docentes = resp;
        } else if (resp && resp.data && Array.isArray(resp.data)) {
          docentes = resp.data;
        } else {
          console.warn('Respuesta inesperada al obtener docentes:', resp);
          Swal.fire({
            icon: 'warning',
            title: 'Advertencia',
            text: 'El formato de la respuesta del servidor no es el esperado.'
          });
          docentes = [];
        }

        // Asignar los datos a ambos arrays
        this.docentes = docentes;
        this.docentesFiltrados = [...docentes];

        // Feedback positivo si deseas
        Swal.fire({
          icon: 'success',
          title: 'Docentes cargados',
          timer: 1000,
          showConfirmButton: false
        });
      },

      error: (error: any) => {
        Swal.close();

        console.error('Error al obtener docentes:', error);
        this.docentesFiltrados = [];

        Swal.fire({
          icon: 'error',
          title: 'Error al cargar',
          text: 'No se pudieron cargar los docentes. Por favor, intente nuevamente.'
        });
      }
    });
  }

  getGeneroTexto(genero: string | null): string {
    if (genero === 'F') return 'Femenino';
    if (genero === 'M') return 'Masculino';
    return 'No especificado';
  }

  buscarDocentes(): void {
    const termino = this.filtro.trim().toLowerCase();
    if (termino === '') {
      this.docentesFiltrados = this.docentes;
    } else {
      this.docentesFiltrados = this.docentes.filter(sub =>
        sub.nombre.toLowerCase().includes(termino)
      );
    }
  }

  openModalToUpdate(docente: any) {
    this.isModalUpdateOpen = true;
    this.passwordUpdate = '';
    this.emailUpdate = docente.email;
    this.firstNameUpdate = docente.first_name;
    this.lastNameUpdate = docente.last_name;
    this.generoUpdate = docente.genero;
    this.especialidadUpdate = docente.especialidad;
    this.activoUpdate = docente.activo;
    this.idSelected = docente.id;
  }

  actualizarDocente() {
    Swal.fire({
      title: 'Actualizando docente...',
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
      especialidad: this.especialidadUpdate
    };

    if (this.passwordUpdate && this.passwordUpdate.trim() !== '') {
      Data.password = this.passwordUpdate;
    }

    console.log('Datos de actualización:', Data);

    this.docentesService.updateDocente(this.idSelected, Data).subscribe(
      {
        next: (resp: any) => {
          this.getDocentes();
          Swal.close();
          Swal.fire({
            position: "center",
            icon: "success",
            title: "Docente actualizado correctamente",
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
            title: "Error al actualizar al docente",
            text: error.error?.message || "Ocurrió un error en el servidor",
            showConfirmButton: true
          });
        }
      }
    );
  }


  deleteDocente(docente: any) {
    // Confirmación antes de eliminar
    Swal.fire({
      title: '¿Estás seguro?',
      text: `¿Deseas eliminar al docente ${docente.nombre}?`,
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
          title: 'Eliminando al docente...',
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading();
          }
        });

        this.docentesService.deleteDocente(docente.id).subscribe({
          next: (resp: any) => {
            console.log(resp);
            this.getDocentes();
            Swal.fire({
              position: "center",
              icon: "success",
              title: "Docente eliminado correctamente",
              showConfirmButton: false,
              timer: 2000
            });
          },
          error: (error: any) => {
            console.log(error);

            Swal.fire({
              position: "center",
              icon: "error",
              title: "Error al eliminar al docente",
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
