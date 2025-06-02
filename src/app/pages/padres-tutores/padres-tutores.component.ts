import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2'
import { PadresTutoresService } from '../../services/padres-tutores.service';

@Component({
  selector: 'app-padres-tutores',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './padres-tutores.component.html',
  styleUrl: './padres-tutores.component.css'
})
export class PadresTutoresComponent implements OnInit {
  tutoresFiltrados: any[] = []; // visibles según filtro  
  filtro: string = '';
  isModalRegisterOpen: boolean = false;
  isModalUpdateOpen: boolean = false;
  email = '';
  password = '';
  firstName = '';
  lastName = '';
  genero = '';
  parentesco = '';
  activo = true; // puede cambiarse con checkbox
  telefono: number | null = null;
  tutores: any[] = [];
  emailUpdate!: string;
  passwordUpdate: string = '';
  firstNameUpdate!: string;
  lastNameUpdate!: string;
  generoUpdate!: string;
  parentescoUpdate!: string;
  telefonoUpdate!: number;
  activoUpdate: boolean = true;
  idSelected!: number;

  constructor(private tutoresService: PadresTutoresService) {
  }

  ngOnInit(): void {
    this.getAll();
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
    this.parentesco = '';
    this.telefono = null;
  }

  // Método principal para registrar 
  register() {
    if (!this.password || !this.email || !this.parentesco || !this.firstName || !this.lastName || !this.genero || this.telefono == null) {
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
      parentesco: this.parentesco,
      telefono: this.telefono,
      roles: ['PADRE_TUTOR']
    };

    this.tutoresService.register(Data).subscribe({
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

  getAll(): void {
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
        this.tutoresFiltrados = [...tutores];

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
        this.tutoresFiltrados = [];
        Swal.fire({
          icon: 'error',
          title: 'Error al cargar',
          text: 'No se pudieron cargar los tutores. Por favor, intente nuevamente.'
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
      this.tutoresFiltrados = this.tutores;
    } else {
      this.tutoresFiltrados = this.tutores.filter(sub =>
        `${sub.first_name} ${sub.last_name}`.toLowerCase().includes(termino)
      );
    }
  }

  openModalToUpdate(tutor: any) {
    this.isModalUpdateOpen = true;
    this.passwordUpdate = '';
    this.emailUpdate = tutor.email;
    this.firstNameUpdate = tutor.first_name;
    this.lastNameUpdate = tutor.last_name;
    this.generoUpdate = tutor.genero;
    this.parentescoUpdate = tutor.parentesco;
    this.activoUpdate = tutor.activo;
    this.idSelected = tutor.id;
    this.telefonoUpdate = tutor.telefono;
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
      parentesco: this.parentescoUpdate,
      telefono: this.telefonoUpdate,
    };

    if (this.passwordUpdate && this.passwordUpdate.trim() !== '') {
      Data.password = this.passwordUpdate;
    }

    console.log('Datos de actualización:', Data);

    this.tutoresService.update(this.idSelected, Data).subscribe(
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

  delete(tutor: any) {
    // Confirmación antes de eliminar
    Swal.fire({
      title: '¿Estás seguro?',
      text: `¿Deseas eliminar al tutor ${tutor.nombre}?`,
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

        this.tutoresService.delete(tutor.id).subscribe({
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
