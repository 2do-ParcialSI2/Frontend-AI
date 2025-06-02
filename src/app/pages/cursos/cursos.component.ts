import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2'
import { EstudiantesService } from '../../services/estudiantes.service';
import { CursosService } from '../../services/cursos.service';
import { MateriasService } from '../../services/materias.service';
import { DocentesService } from '../../services/docentes.service';
import { HorariosService } from '../../services/horarios.service';
import { map } from 'rxjs/operators';

interface MateriaDocente {
  id: number;
  materia_id: number;
  materia_nombre: string;
  docente_id?: number;
  docente_nombre?: string;
  horarios: {
    id: number;
    dia: string;
    dia_semana: string;
    hora_inicio: string;
    hora_fin: string;
  }[];
}

interface CursoDetalle {
  id: number;
  nombre: string;
  turno: string;
  materias_docentes: MateriaDocente[];
}

interface DetalleMateria {
  id: number;
  nombre: string;
  docente_nombre: string;
  docente_id?: number;
  horarios: any[];
  estado?: 'procesando' | 'asignado' | 'sin_asignar';
}

@Component({
  selector: 'app-cursos',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './cursos.component.html',
  styleUrl: './cursos.component.css'
})
export class CursosComponent implements OnInit {
  Filtrados: any[] = []; // visibles según filtro  
  filtro: string = '';
  isModalRegisterOpen: boolean = false;
  isModalUpdateOpen: boolean = false;
  isModalDetallesOpen: boolean = false;
  isModalEditDetallesOpen: boolean = false;
  nombre = '';
  selectedTurno: number | null = null;
  turnos: any[] = [];
  cursos: any[] = [];
  materias: any[] = [];
  estudiantes: any[] = [];
  asignaciones: any[] = [];
  nombreUpdate!: string;
  selectedTurnoUpdate!: number;
  idSelected!: number;
  docentes: any[] = [];
  horarios: any[] = [];
  cursoSeleccionado: any = null;
  detallesMaterias: any[] = [];
  
  // Para edición de detalles
  materiaSeleccionada: any = null;
  docenteSeleccionado: number | null = null;
  horariosSeleccionados: number[] = [];

  //modal dinamico para asignacion de docente, materias y horarios
  materiasSeleccionadas: number[] = [];
  selectedMateriaId: number = 0;
  selectedDocenteId: number = 0;
  selectedCurso: any;

  modalMateriasVisible = false;
  modalDocenteVisible = false;
  modalHorariosVisible = false;
  horariosOcupados: number[] = []; // Nuevo array para horarios ocupados

  // Nuevo mapa para rastrear materias con docentes asignados recientemente
  materiasConDocenteAsignado: Map<number, { docenteId: number, timestamp: number }> = new Map();

  constructor(private cursoService: CursosService, private materiaService: MateriasService, private docenteService: DocentesService, private horarioService: HorariosService) {
  }

  ngOnInit(): void {
    this.getAll();
    this.getDocentes();
    this.getMaterias();
    this.getTurnos();
    this.getHorarios();
  }

  activeRegisterForm() {
    if (!this.turnos || this.turnos.length === 0) {
      this.getTurnos().subscribe({
        next: () => {
          this.limpiarFormulario();
          this.isModalRegisterOpen = true;
        },
        error: () => {
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudieron cargar los turnos. Por favor, intente nuevamente.'
          });
        }
      });
    } else {
      this.limpiarFormulario();
      this.isModalRegisterOpen = true;
    }
  }

  // Método para limpiar el formulario
  limpiarFormulario() {
    this.nombre = '';
    this.selectedTurno = null;
  }

  getMaterias(): void {
    this.materiaService.getAll().subscribe({
      next: (resp: any) => {
        let materias: any[] = [];

        // Verifica si la respuesta viene anidada (por ejemplo { data: [...] }) o es directamente un array
        if (resp && Array.isArray(resp)) {
          materias = resp;
        } else if (resp && resp.data && Array.isArray(resp.data)) {
          materias = resp.data;
        } else if (resp && typeof resp === 'object') {
          // Si es un objeto, intentar convertirlo en array
          materias = Object.values(resp).filter(item => typeof item === 'object');
        } else {
          console.warn('Respuesta inesperada al obtener la información:', resp);
          Swal.fire({
            icon: 'warning',
            title: 'Advertencia',
            text: 'El formato de la respuesta del servidor no es el esperado.'
          });
          materias = [];
        }

        // Asignar SOLO ACTIVAS
        const materiasActivas = materias.filter(m => m.estado?.toLowerCase() === 'activo' || m.estado === true);
        this.materias = materiasActivas;
      },
      error: (error: any) => {
        console.error('Error al obtener materias:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudieron cargar las materias'
        });
      }
    });
  }
  getNombresMaterias(curso: any): string {
    if (!curso || !curso.materias || curso.materias.length === 0) {
      return 'Sin materias asignadas';
    }
    return curso.materias.map((m: any) => m.nombre).join(', ');
  }

  getTurnos(): any {
    return this.cursoService.getTurnos().pipe(
      map((resp: any) => {
        let turnos: any[] = [];

        // Verifica si la respuesta viene anidada (por ejemplo { data: [...] }) o es directamente un array
        if (resp && Array.isArray(resp)) {
          turnos = resp;
        } else if (resp && resp.data && Array.isArray(resp.data)) {
          turnos = resp.data;
        } else if (resp && typeof resp === 'object') {
          // Si es un objeto, intentar convertirlo en array
          turnos = Object.values(resp).filter(item => typeof item === 'object');
        } else {
          console.warn('Respuesta inesperada al obtener turnos:', resp);
          turnos = [];
        }

        // Asignar los datos
        this.turnos = turnos;
        console.log('Turnos cargados:', this.turnos);
        return turnos;
      })
    );
  }

  getDocentes() {
    this.docenteService.getDocentes().subscribe(res => this.docentes = res);
  }

  getHorarios() {
    this.horarioService.getAll().subscribe(res => this.horarios = res);
  }
  // Método principal para registrar 
  register() {
    if (!this.nombre || !this.selectedTurno) {
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
      turno: this.selectedTurno,
    };

    this.cursoService.register(Data).subscribe({
      next: (resp: any) => {
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
    Swal.fire({
      title: 'Cargando data...',
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading()
    });

    this.cursoService.getAll().subscribe({
      next: (cursosPromise: Promise<any[]>) => {
        cursosPromise.then(cursos => {
          this.cursos = cursos;
          this.Filtrados = [...cursos];
          
          Swal.fire({
            icon: 'success',
            title: 'Información cargada correctamente',
            timer: 1000,
            showConfirmButton: false
          });
        });
      },
      error: (error: any) => {
        Swal.close();
        console.error('Error al obtener la data:', error);
        this.Filtrados = [];
        Swal.fire({
          icon: 'error',
          title: 'Error al cargar',
          text: 'No se pudieron cargar los cursos. Por favor, intente nuevamente.'
        });
      }
    });
  }

  buscar(): void {
    const termino = this.filtro.trim().toLowerCase();
    if (termino === '') {
      this.Filtrados = this.cursos;
    } else {
      this.Filtrados = this.cursos.filter(sub =>
        `${sub.nombre}`.toLowerCase().includes(termino)
      );
    }
  }

  openModalToUpdate(data: any) {
    if (!this.turnos || this.turnos.length === 0) {
      this.getTurnos().subscribe({
        next: () => {
          this.isModalUpdateOpen = true;
          this.nombreUpdate = data.nombre;
          this.selectedTurnoUpdate = data.turno;
          this.idSelected = data.id;
        },
        error: () => {
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudieron cargar los turnos. Por favor, intente nuevamente.'
          });
        }
      });
    } else {
      this.isModalUpdateOpen = true;
      this.nombreUpdate = data.nombre;
      this.selectedTurnoUpdate = data.turno;
      this.idSelected = data.id;
    }
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
      turno: this.selectedTurnoUpdate,
    };

    this.cursoService.update(this.idSelected, Data).subscribe(
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

  delete(curso: any) {
    // Confirmación antes de eliminar
    Swal.fire({
      title: '¿Estás seguro?',
      text: `¿Deseas eliminar el curso ${curso.nombre}?`,
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

        this.cursoService.delete(curso.id).subscribe({
          next: (resp: any) => {
            this.getAll();
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
  openModalMaterias(curso: any) {
    this.selectedCurso = curso;
    this.materiasSeleccionadas = [];
    
    // Recargar las materias antes de mostrar el modal
    this.materiaService.getAll().subscribe({
      next: (resp: any) => {
        if (Array.isArray(resp)) {
          this.materias = resp;
        } else if (resp && resp.data && Array.isArray(resp.data)) {
          this.materias = resp.data;
        } else if (resp && typeof resp === 'object') {
          this.materias = Object.values(resp).filter(item => typeof item === 'object');
        }
        this.modalMateriasVisible = true;
      },
      error: (error) => {
        console.error('Error al cargar materias:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudieron cargar las materias disponibles'
        });
      }
    });
  }

  closeModalMaterias() {
    this.modalMateriasVisible = false;
    this.materiasSeleccionadas = [];
    this.selectedCurso = null;
  }

  onMateriaCheckboxChange(event: any) {
    const id = +event.target.value;
    if (event.target.checked) {
      this.materiasSeleccionadas.push(id);
    } else {
      this.materiasSeleccionadas = this.materiasSeleccionadas.filter(i => i !== id);
    }
  }

  submitAsignarMaterias() {
    if (!this.materiasSeleccionadas.length) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Por favor, seleccione al menos una materia'
      });
      return;
    }

    Swal.fire({
      title: 'Asignando materias...',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });
    
    this.cursoService.asignarMaterias(this.selectedCurso.id, this.materiasSeleccionadas).subscribe({
      next: (resp) => {
        this.modalMateriasVisible = false; // Cerrar primero el modal
        Swal.fire({
          icon: 'success',
          title: 'Éxito',
          text: 'Materias asignadas correctamente',
          timer: 1500,
          showConfirmButton: false
        }).then(() => {
          // Después de que se cierre el mensaje de éxito, actualizar la vista
          this.openModalDetalles(this.selectedCurso);
        });
      },
      error: (error) => {
        console.error('Error al asignar materias:', error);
        let errorMessage = 'No se pudieron asignar las materias';
        
        if (error.error?.message) {
          errorMessage = error.error.message;
        } else if (error.status === 404) {
          errorMessage = 'No se encontró el endpoint para asignar materias. Por favor, verifique la configuración del servidor.';
        } else if (error.status === 400) {
          errorMessage = 'Los datos enviados no son válidos. Por favor, verifique la selección de materias.';
        }
        
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: errorMessage,
          showConfirmButton: true
        });
      }
    });
  }

  openModalDocente(materia: any) {
    console.log('Abriendo modal para materia:', materia);
    this.selectedMateriaId = materia.id;
    this.selectedCurso = this.cursoSeleccionado; // Guardamos la referencia del curso actual
    
    // Recargar la lista de docentes antes de mostrar el modal
    this.docenteService.getDocentes().subscribe({
      next: (docentes) => {
        console.log('Docentes cargados:', docentes);
        if (Array.isArray(docentes)) {
          this.docentes = docentes;
        } else if (docentes && docentes.data && Array.isArray(docentes.data)) {
          this.docentes = docentes.data;
        } else {
          console.warn('Formato inesperado de respuesta de docentes:', docentes);
          this.docentes = [];
        }

        if (this.docentes.length === 0) {
          Swal.fire({
            icon: 'warning',
            title: 'Sin docentes',
            text: 'No hay docentes disponibles para asignar'
          });
        } else {
          this.modalDocenteVisible = true;
        }
      },
      error: (error) => {
        console.error('Error al cargar docentes:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudieron cargar los docentes disponibles'
        });
      }
    });
  }

  closeModalDocente() {
    this.modalDocenteVisible = false;
    this.selectedMateriaId = 0;
    this.selectedDocenteId = 0;
  }

  onMateriaDocenteChange(event: any) {
    this.selectedMateriaId = +event.target.value;
  }

  onDocenteChange(event: any) {
    this.selectedDocenteId = +event.target.value;
  }

  openModalHorarios(materia: any) {
    console.log('Abriendo modal para horarios de materia:', materia);
    this.selectedMateriaId = materia.id;
    this.selectedCurso = this.cursoSeleccionado;
    this.horariosSeleccionados = materia.horarios?.map((h: any) => h.id) || [];
    this.horariosOcupados = []; // Limpiamos los horarios ocupados
    
    // Si la materia tiene un docente asignado, obtenemos sus horarios ocupados
    if (materia.docente_id) {
      this.docenteService.getHorarioDocente(materia.docente_id, {}).subscribe({
        next: (response: any) => {
          console.log('Respuesta de horarios del docente:', response);
          
          // Extraer los horarios del docente de la respuesta
          if (response && response.horarios && Array.isArray(response.horarios)) {
            // Tomamos directamente los horario_id de todos los horarios
            // ya que la respuesta ya viene filtrada por docente
            this.horariosOcupados = response.horarios
              .map((h: any) => h.horario_id)
              .filter((id: number) => id !== undefined && id !== null);
          } else {
            this.horariosOcupados = [];
          }
          
          console.log('Materia actual:', materia.nombre);
          console.log('Horarios ocupados del docente:', this.horariosOcupados);
        },
        error: (error) => {
          console.error('Error al obtener horarios del docente:', error);
          this.horariosOcupados = [];
        }
      });
    }
    
    // Recargar la lista de horarios antes de mostrar el modal
    this.horarioService.getAll().subscribe({
      next: (horarios) => {
        console.log('Horarios cargados:', horarios);
        if (Array.isArray(horarios)) {
          this.horarios = horarios;
        } else if (horarios && horarios.data && Array.isArray(horarios.data)) {
          this.horarios = horarios.data;
        } else {
          console.warn('Formato inesperado de respuesta de horarios:', horarios);
          this.horarios = [];
        }

        if (this.horarios.length === 0) {
          Swal.fire({
            icon: 'warning',
            title: 'Sin horarios',
            text: 'No hay horarios disponibles para asignar'
          });
        } else {
          this.modalHorariosVisible = true;
        }
      },
      error: (error) => {
        console.error('Error al cargar horarios:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudieron cargar los horarios disponibles'
        });
      }
    });
  }

  // Método auxiliar para verificar si un horario está ocupado
  isHorarioOcupado(horarioId: number): boolean {
    return this.horariosOcupados.includes(horarioId);
  }

  // Modificamos el método para no permitir seleccionar horarios ocupados
  onHorarioCheckboxChange(event: any) {
    const id = +event.target.value;
    if (this.isHorarioOcupado(id)) {
      event.preventDefault();
      event.target.checked = false;
      Swal.fire({
        icon: 'warning',
        title: 'Horario no disponible',
        text: 'El docente ya tiene una clase asignada en este horario',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000
      });
      return;
    }
    
    if (event.target.checked) {
      this.horariosSeleccionados.push(id);
    } else {
      this.horariosSeleccionados = this.horariosSeleccionados.filter(i => i !== id);
    }
  }

  submitAsignarDocente() {
    if (!this.selectedDocenteId || !this.selectedMateriaId || !this.selectedCurso) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Por favor, seleccione un docente'
      });
      return;
    }

    Swal.fire({
      title: 'Asignando docente...',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    // Registramos la asignación del docente antes de hacer la petición
    this.materiasConDocenteAsignado.set(this.selectedMateriaId, {
      docenteId: this.selectedDocenteId,
      timestamp: Date.now()
    });

    // Actualizamos inmediatamente la vista para mostrar el estado "procesando"
    const materiaIndex = this.detallesMaterias.findIndex(m => m.id === this.selectedMateriaId);
    if (materiaIndex !== -1) {
      this.detallesMaterias[materiaIndex] = {
        ...this.detallesMaterias[materiaIndex],
        docente_nombre: 'Procesando docente...',
        docente_id: this.selectedDocenteId,
        estado: 'procesando'
      };
    }

    // Actualizamos el curso en la lista principal para reflejar el estado "procesando"
    const cursoIndex = this.cursos.findIndex(c => c.id === this.selectedCurso.id);
    if (cursoIndex !== -1) {
      this.cursos[cursoIndex] = {
        ...this.cursos[cursoIndex],
        materias: this.detallesMaterias
      };
      this.Filtrados = [...this.cursos];
    }

    this.cursoService.asignarDocente(
      this.selectedCurso.id,
      this.selectedMateriaId,
      this.selectedDocenteId
    ).subscribe({
      next: (resp) => {
        this.modalDocenteVisible = false;
        
        // Mostramos el mensaje de éxito
        Swal.fire({
          icon: 'success',
          title: 'Éxito',
          text: 'Docente asignado correctamente',
          timer: 1500,
          showConfirmButton: false
        });

        // Esperamos 5 minutos antes de actualizar los detalles
        setTimeout(() => {
          // Recargamos los detalles del curso
          this.cursoService.getMateriasConDocentes(this.selectedCurso.id).subscribe({
            next: (cursoActualizado: CursoDetalle) => {
              this.cursoSeleccionado = cursoActualizado;
              
              // Procesamos las materias actualizadas usando la misma lógica
              this.detallesMaterias = cursoActualizado.materias_docentes.map((item: MateriaDocente): DetalleMateria => {
                if (item.docente_nombre) {
                  this.materiasConDocenteAsignado.delete(item.materia_id);
                  return {
                    id: item.materia_id,
                    nombre: item.materia_nombre,
                    docente_nombre: item.docente_nombre,
                    docente_id: item.docente_id,
                    horarios: item.horarios || [],
                    estado: 'asignado'
                  };
                }

                const docenteAsignado = this.materiasConDocenteAsignado.get(item.materia_id);
                if (docenteAsignado) {
                  return {
                    id: item.materia_id,
                    nombre: item.materia_nombre,
                    docente_nombre: 'Procesando docente...',
                    docente_id: docenteAsignado.docenteId,
                    horarios: item.horarios || [],
                    estado: 'procesando'
                  };
                }

                return {
                  id: item.materia_id,
                  nombre: item.materia_nombre,
                  docente_nombre: 'Sin asignar',
                  docente_id: item.docente_id,
                  horarios: item.horarios || [],
                  estado: 'sin_asignar'
                };
              });
              
              // Actualizamos el curso en la lista principal
              const index = this.cursos.findIndex(c => c.id === this.selectedCurso.id);
              if (index !== -1) {
                this.cursos[index] = {
                  ...this.cursos[index],
                  materias: this.detallesMaterias
                };
                this.Filtrados = [...this.cursos];
              }
            },
            error: (error) => {
              console.error('Error al recargar detalles:', error);
              Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'El docente se asignó pero hubo un error al actualizar la vista'
              });
            }
          });
        }, 5000); // 5 minutos = 300000 milisegundos
      },
      error: (error) => {
        // En caso de error, eliminamos el estado de procesamiento
        this.materiasConDocenteAsignado.delete(this.selectedMateriaId);
        
        // Restauramos el estado original de la materia
        const materiaIndex = this.detallesMaterias.findIndex(m => m.id === this.selectedMateriaId);
        if (materiaIndex !== -1) {
          this.detallesMaterias[materiaIndex] = {
            ...this.detallesMaterias[materiaIndex],
            docente_nombre: 'Sin asignar',
            docente_id: null,
            estado: 'sin_asignar'
          };
        }

        // Actualizamos también la lista principal en caso de error
        const cursoIndex = this.cursos.findIndex(c => c.id === this.selectedCurso.id);
        if (cursoIndex !== -1) {
          this.cursos[cursoIndex] = {
            ...this.cursos[cursoIndex],
            materias: this.detallesMaterias
          };
          this.Filtrados = [...this.cursos];
        }

        console.error('Error al asignar docente:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: error.error?.message || 'No se pudo asignar el docente'
        });
      }
    });
  }

  submitAsignarHorarios() {
    if (!this.selectedMateriaId || !this.horariosSeleccionados.length) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Por favor, seleccione al menos un horario'
      });
      return;
    }

    Swal.fire({
      title: 'Asignando horarios...',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    // Actualizamos inmediatamente la vista para mostrar los horarios seleccionados
    const materiaIndex = this.detallesMaterias.findIndex(m => m.id === this.selectedMateriaId);
    if (materiaIndex !== -1) {
      const horariosSeleccionados = this.horarios
        .filter(h => this.horariosSeleccionados.includes(h.id))
        .map(h => ({
          id: h.id,
          dia: h.dia,
          dia_semana: h.dia_semana,
          hora_inicio: h.hora_inicio,
          hora_fin: h.hora_fin
        }));

      this.detallesMaterias[materiaIndex] = {
        ...this.detallesMaterias[materiaIndex],
        horarios: horariosSeleccionados
      };

      // Actualizamos el curso en la lista principal
      const cursoIndex = this.cursos.findIndex(c => c.id === this.selectedCurso.id);
      if (cursoIndex !== -1) {
        this.cursos[cursoIndex] = {
          ...this.cursos[cursoIndex],
          materias: this.detallesMaterias
        };
        this.Filtrados = [...this.cursos];
      }
    }

    this.cursoService.asignarHorario(
      this.selectedCurso.id,
      this.selectedMateriaId,
      this.horariosSeleccionados
    ).subscribe({
      next: (resp) => {
        this.modalHorariosVisible = false;
        
        // Mostramos el mensaje de éxito
        Swal.fire({
          icon: 'success',
          title: 'Éxito',
          text: 'Horarios asignados correctamente',
          timer: 1500,
          showConfirmButton: false
        });

        // Recargamos los detalles del curso para obtener la información actualizada
        setTimeout(() => {
          this.cursoService.getMateriasConDocentes(this.selectedCurso.id).subscribe({
            next: (cursoActualizado: CursoDetalle) => {
              this.cursoSeleccionado = cursoActualizado;
              
              // Actualizamos los detalles de las materias
              this.detallesMaterias = cursoActualizado.materias_docentes.map((item: MateriaDocente): DetalleMateria => {
                return {
                  id: item.materia_id,
                  nombre: item.materia_nombre,
                  docente_nombre: item.docente_nombre || 'Sin asignar',
                  docente_id: item.docente_id,
                  horarios: item.horarios || [],
                  estado: item.docente_nombre ? 'asignado' : 'sin_asignar'
                };
              });
              
              // Actualizamos el curso en la lista principal
              const index = this.cursos.findIndex(c => c.id === this.selectedCurso.id);
              if (index !== -1) {
                this.cursos[index] = {
                  ...this.cursos[index],
                  materias: this.detallesMaterias
                };
                this.Filtrados = [...this.cursos];
              }
            },
            error: (error) => {
              console.error('Error al recargar detalles:', error);
              // No mostramos error ya que los horarios se asignaron correctamente
            }
          });
        }, 5000); // Esperamos 5 segundos antes de actualizar los detalles
      },
      error: (error) => {
        // En caso de error, restauramos los horarios originales
        const materiaIndex = this.detallesMaterias.findIndex(m => m.id === this.selectedMateriaId);
        if (materiaIndex !== -1) {
          const materiaOriginal = this.cursoSeleccionado.materias_docentes.find(
            (m: MateriaDocente) => m.materia_id === this.selectedMateriaId
          );
          
          if (materiaOriginal) {
            this.detallesMaterias[materiaIndex] = {
              ...this.detallesMaterias[materiaIndex],
              horarios: materiaOriginal.horarios || []
            };

            // Actualizamos también la lista principal
            const cursoIndex = this.cursos.findIndex(c => c.id === this.selectedCurso.id);
            if (cursoIndex !== -1) {
              this.cursos[cursoIndex] = {
                ...this.cursos[cursoIndex],
                materias: this.detallesMaterias
              };
              this.Filtrados = [...this.cursos];
            }
          }
        }

        console.error('Error al asignar horarios:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: error.error?.message || 'El docente ya dicta otra materia en ese mismo horario, por favor seleccione otro horario.'
        });
      }
    });
  }

  openModalDetalles(curso: any) {
    this.cursoService.getMateriasConDocentes(curso.id).subscribe({
      next: (resp: CursoDetalle) => {
        this.cursoSeleccionado = resp;

        // Procesamos las materias para la tabla de detalles
        this.detallesMaterias = resp.materias_docentes.map((item: MateriaDocente): DetalleMateria => {
          // Si la respuesta viene del endpoint con docentes (tiene docente_nombre)
          // significa que estamos usando el endpoint correcto y podemos mostrar los datos reales
          if (item.docente_nombre) {
            // Limpiamos el registro de esta materia ya que tenemos los datos reales
            this.materiasConDocenteAsignado.delete(item.materia_id);
            
            return {
              id: item.materia_id,
              nombre: item.materia_nombre,
              docente_nombre: item.docente_nombre,
              docente_id: item.docente_id,
              horarios: item.horarios || [],
              estado: 'asignado'
            };
          }

          // Si la materia tiene un docente asignado recientemente pero aún no tenemos los datos reales
          const docenteAsignado = this.materiasConDocenteAsignado.get(item.materia_id);
          if (docenteAsignado) {
            return {
              id: item.materia_id,
              nombre: item.materia_nombre,
              docente_nombre: 'Procesando docente...',
              docente_id: docenteAsignado.docenteId,
              horarios: item.horarios || [],
              estado: 'procesando'
            };
          }

          // Si no tiene docente
          return {
            id: item.materia_id,
            nombre: item.materia_nombre,
            docente_nombre: 'Sin asignar',
            docente_id: item.docente_id,
            horarios: item.horarios || [],
            estado: 'sin_asignar'
          };
        });

        // Actualizamos el curso en la lista principal
        const index = this.cursos.findIndex(c => c.id === curso.id);
        if (index !== -1) {
          this.cursos[index] = {
            ...this.cursos[index],
            materias: this.detallesMaterias
          };
          this.Filtrados = [...this.cursos];
        }

        this.isModalDetallesOpen = true;
      },
      error: (error) => {
        console.error('Error al cargar detalles:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudieron cargar los detalles del curso'
        });
      }
    });
  }

  closeModalDetalles() {
    this.isModalDetallesOpen = false;
    this.cursoSeleccionado = null;
    this.detallesMaterias = [];
  }

  openModalEditarDetalle(materia: any) {
    this.materiaSeleccionada = materia;
    this.docenteSeleccionado = materia.docente_id;
    this.horariosSeleccionados = materia.horarios_ids || [];
    this.isModalEditDetallesOpen = true;
  }

  closeModalEditarDetalle() {
    this.isModalEditDetallesOpen = false;
    this.materiaSeleccionada = null;
    this.docenteSeleccionado = null;
    this.horariosSeleccionados = [];
  }

  guardarEdicionDetalle() {
    if (!this.materiaSeleccionada || !this.docenteSeleccionado || this.horariosSeleccionados.length === 0) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Por favor complete todos los campos'
      });
      return;
    }

    const data = {
      asignaciones: [{
        materia_id: this.materiaSeleccionada.id,
        docente_id: this.docenteSeleccionado,
        horarios_ids: this.horariosSeleccionados
      }]
    };

    this.cursoService.modificarDetalles(this.cursoSeleccionado.id, data).subscribe({
      next: (resp) => {
        Swal.fire({
          icon: 'success',
          title: 'Éxito',
          text: 'Detalles actualizados correctamente'
        });
        this.closeModalEditarDetalle();
        this.openModalDetalles(this.cursoSeleccionado);
      },
      error: (error) => {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: error.error?.message || 'No se pudieron actualizar los detalles'
        });
      }
    });
  }

  eliminarMateria(materia: any) {
    Swal.fire({
      title: '¿Está seguro?',
      text: `¿Desea eliminar la materia ${materia.nombre} del curso?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.cursoService.deleteMateria(this.cursoSeleccionado.id, materia.id).subscribe({
          next: () => {
            Swal.fire({
              icon: 'success',
              title: 'Éxito',
              text: 'Materia eliminada correctamente'
            });
            this.openModalDetalles(this.cursoSeleccionado);
          },
          error: (error) => {
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: error.error?.message || 'No se pudo eliminar la materia'
            });
          }
        });
      }
    });
  }

  // Método para recargar los detalles del curso
  recargarDetallesCurso() {
    if (this.selectedCurso) {
      this.cursoService.getMaterias(this.selectedCurso.id).subscribe({
        next: (resp: any) => {
          console.log('Respuesta al recargar detalles:', resp);
          this.cursoSeleccionado = resp;
          this.detallesMaterias = resp.materias.map((materia: any) => {
            if (materia.docente) {
              return {
                ...materia,
                docente: {
                  id: materia.docente.id,
                  first_name: materia.docente.first_name || '',
                  last_name: materia.docente.last_name || ''
                }
              };
            }
            return materia;
          });
          
          console.log('Detalles actualizados:', {
            cursoSeleccionado: this.cursoSeleccionado,
            detallesMaterias: this.detallesMaterias
          });
        },
        error: (error) => {
          console.error('Error al recargar detalles:', error);
        }
      });
    }
  }

  closeModalHorarios() {
    this.modalHorariosVisible = false;
    this.selectedMateriaId = 0;
    this.horariosSeleccionados = [];
  }

}
