import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import Swal from 'sweetalert2'
//import { error } from 'console';
import { UserService } from '../../services/user.service';
import { RoleService } from '../../services/rol.service';

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './usuario.component.html',
  styleUrl: './usuario.component.css'
})

export class UsuarioComponent implements OnInit {
  usersFiltrados: any[] = []; // visibles según filtro  
  filtro: string = '';
  isModalRegisterUserOpen: boolean = false;
  isModalUpdateUserOpen: boolean = false;
  email = '';
  password = '';
  firstName = '';
  lastName = '';
  genero = '';
  activo = true; // puede cambiarse con checkbox
  selectedRole = '';
  roles: Array<any>;
  users: any[] = [];
  emailUpdate!: string;
  passwordUpdate: string = '';
  firstNameUpdate!: string;
  lastNameUpdate!: string;
  generoUpdate!: string;
  activoUpdate: boolean = true;
  roleUpdate!: number;
  userIdSelected!: number;


  constructor(private userService: UserService, private roleService: RoleService) {
    this.roles = [];
  }

  ngOnInit(): void {
    this.getRoles();
    this.getUsers();
  }


  getRoles() {
    this.roleService.getRols().subscribe(
      {
        next: (resp: any) => {
          console.log(resp);
          this.roles = resp;
        },
        error: (error: any) => {
          console.log(error);
        }
      }
    );
  }

  activeRegisterForm() {
    this.limpiarFormulario();
    this.isModalRegisterUserOpen = true;
  }

  // Método para limpiar el formulario
  limpiarFormulario() {
    this.password = '';
    this.email = '';
    this.firstName = '';
    this.lastName = '';
    this.genero = '';
    this.activo = true;
    this.selectedRole = '';
  }

  // Método principal para registrar usuarios
  registerUser() {
    if (!this.password || !this.email || !this.selectedRole || !this.firstName || !this.lastName || !this.genero) {
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
      title: 'Registrando usuario...',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    const user = {
      password: this.password,
      email: this.email,
      first_name: this.firstName,
      last_name: this.lastName,
      genero: this.genero,
      activo: this.activo,
      roles: [parseInt(this.selectedRole)]
    };

    this.userService.registerUser(user).subscribe({
      next: (resp: any) => {
        console.log(resp);
        Swal.close();

        const esExitoso = resp.id || (resp.data && resp.data.id) || resp.statusCode === 200 || resp.statusCode === 201;

        if (esExitoso) {
          this.getUsers();
          Swal.fire({
            position: "center",
            icon: "success",
            title: "Usuario registrado correctamente",
            showConfirmButton: false,
            timer: 2000
          });

          this.limpiarFormulario();

          setTimeout(() => {
            this.closeRegisterUserModal();
          }, 2100);
        } else {
          Swal.fire({
            position: "center",
            icon: "error",
            title: "Error al registrar el usuario",
            text: resp.message || "Verifica los datos ingresados",
            showConfirmButton: true
          });
        }
      },
      error: (error: any) => {
        console.log('Error al registrar usuario:', error);
        Swal.fire({
          position: "center",
          icon: "error",
          title: "Error al registrar el usuario",
          text: error.error?.message || "Ocurrió un error en el servidor",
          showConfirmButton: true
        });
      }
    });
  }


  getUsers(): void {
    // Mostrar SweetAlert de carga
    Swal.fire({
      title: 'Cargando usuarios...',
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading()
    });

    this.userService.getUsers().subscribe({
      next: (resp: any) => {
        Swal.close(); // Cerrar la alerta de carga

        let usuarios: any[] = [];

        // Verifica si la respuesta viene anidada (por ejemplo { data: [...] }) o es directamente un array
        if (resp && Array.isArray(resp)) {
          usuarios = resp;
        } else if (resp && resp.data && Array.isArray(resp.data)) {
          usuarios = resp.data;
        } else {
          console.warn('Respuesta inesperada al obtener usuarios:', resp);
          Swal.fire({
            icon: 'warning',
            title: 'Advertencia',
            text: 'El formato de la respuesta del servidor no es el esperado.'
          });
          usuarios = [];
        }

        // Asignar los datos a ambos arrays
        this.users = usuarios;
        this.usersFiltrados = [...usuarios];

        // Feedback positivo si deseas
        Swal.fire({
          icon: 'success',
          title: 'Usuarios cargados',
          timer: 1000,
          showConfirmButton: false
        });
      },

      error: (error: any) => {
        Swal.close();

        console.error('Error al obtener usuarios:', error);
        this.users = [];
        this.usersFiltrados = [];

        Swal.fire({
          icon: 'error',
          title: 'Error al cargar',
          text: 'No se pudieron cargar los usuarios. Por favor, intente nuevamente.'
        });
      }
    });
  }

  getGeneroTexto(genero: string | null): string {
    if (genero === 'F') return 'Femenino';
    if (genero === 'M') return 'Masculino';
    return 'No especificado';
  }

  buscarUsuarios(): void {
    const termino = this.filtro.trim().toLowerCase();
    if (termino === '') {
      this.usersFiltrados = this.users;
    } else {
      this.usersFiltrados = this.users.filter(sub =>
        sub.nombre.toLowerCase().includes(termino)
      );
    }
  }

  openModalToUpdateUser(user: any) {
    this.isModalUpdateUserOpen = true;
    this.passwordUpdate = '';
    this.emailUpdate = user.email;
    this.firstNameUpdate = user.first_name;
    this.lastNameUpdate = user.last_name;
    this.generoUpdate = user.genero;
    this.activoUpdate = user.activo;
    this.roleUpdate = user.rol?.id;
    this.userIdSelected = user.id;
  }

  actualizarUsuario() {
    Swal.fire({
      title: 'Actualizando usuario...',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    let userData: any = {
      email: this.emailUpdate,
      first_name: this.firstNameUpdate,
      last_name: this.lastNameUpdate,
      genero: this.generoUpdate,
      activo: this.activoUpdate,
      roles: [this.roleUpdate]
    };

    if (this.passwordUpdate && this.passwordUpdate.trim() !== '') {
      userData.password = this.passwordUpdate;
    }

    console.log('Datos de actualización:', userData);

    this.userService.updateUser(this.userIdSelected, userData).subscribe(
      {
        next: (resp: any) => {
          Swal.close();
          this.getUsers();
          Swal.fire({
            position: "center",
            icon: "success",
            title: "Usuario actualizado correctamente",
            showConfirmButton: false,
            timer: 2000
          });
          setTimeout(() => {
            this.closeUpdateUserModal();
          }, 2100);
        },
        error: (error: any) => {
          console.log(error);
          Swal.fire({
            position: "center",
            icon: "error",
            title: "Error al actualizar el usuario",
            text: error.error?.message || "Ocurrió un error en el servidor",
            showConfirmButton: true
          });
        }
      }
    );
  }


  deleteUser(user: any) {
    // Confirmación antes de eliminar
    Swal.fire({
      title: '¿Estás seguro?',
      text: `¿Deseas eliminar al usuario ${user.nombre}?`,
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
          title: 'Eliminando usuario...',
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading();
          }
        });

        this.userService.deleteUser(user.id).subscribe({
          next: (resp: any) => {
            console.log(resp);

            // Actualizar la lista de usuarios primero
            this.getUsers();

            Swal.fire({
              position: "center",
              icon: "success",
              title: "Usuario eliminado correctamente",
              showConfirmButton: false,
              timer: 2000
            });
          },
          error: (error: any) => {
            console.log(error);

            Swal.fire({
              position: "center",
              icon: "error",
              title: "Error al eliminar el usuario",
              text: error.error?.message || "Ocurrió un error en el servidor",
              showConfirmButton: true
            });
          }
        });
      }
    });
  }

  updateRoleId($event: any) {
    this.roleUpdate = $event;
    console.log(this.roleUpdate);
    console.log($event);
  }

  closeRegisterUserModal() {
    this.isModalRegisterUserOpen = false;
  }

  closeUpdateUserModal() {
    this.isModalUpdateUserOpen = false;
  }
}
