import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2'
import { HorariosService } from '../../services/horarios.service';

@Component({
  selector: 'app-horarios',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './horarios.component.html',
  styleUrl: './horarios.component.css'
})
export class HorariosComponent implements OnInit {
  Filtrados: any[] = []; // visibles según filtro  
  filtro: string = '';
  isModalRegisterOpen: boolean = false;
  isModalUpdateOpen: boolean = false;
  nombre = '';
  horaInicio = '';
  horaFin = '';
  dia = '';
  horarios: any[] = [];
  nombreUpdate = '';
  horaInicioUpdate = '';
  horaFinUpdate = '';
  selectedDiaUpdate = '';
  idSelected!: number;

  constructor(private horarioService: HorariosService) {
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
    this.nombre = '';
    this.horaInicio = '';
    this.horaFin = '';
    this.dia = '';
  }

  // Método principal para registrar 
  register() {
    if (!this.nombre || !this.horaInicio || !this.horaFin || !this.dia) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Todos los campos son obligatorios'
      });
      return;
    }

    const data = {
      nombre: this.nombre,
      hora_inicio: this.horaInicio,
      hora_fin: this.horaFin,
      dia_semana: this.dia
    };

    this.horarioService.register(data).subscribe({
      next: (resp) => {
        Swal.fire({
          icon: 'success',
          title: 'Éxito',
          text: 'Horario registrado correctamente',
          timer: 1500,
          showConfirmButton: false
        });
        this.getAll();
        this.closeRegisterModal();
      },
      error: (error) => {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: error.error?.message || 'Error al registrar el horario'
        });
      }
    });
  }

  getAll(): void {
    Swal.fire({
      title: 'Cargando horarios...',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    this.horarioService.getAll().subscribe({
      next: (horarios: any[]) => {
        console.log('Horarios recibidos:', horarios);
        this.horarios = horarios;
        
        // Procesamos un horario a la vez
        const procesarHorarios = async () => {
          for (const horario of horarios) {
            try {
              console.log(`Obteniendo materias para ${horario.dia_semana} - ${horario.hora_inicio}`);
              const materias = await this.horarioService.getPorDia(horario.dia_semana).toPromise();
              console.log('Materias recibidas:', materias);
              
              // Filtramos las materias que coinciden con el horario actual
              const materiasDelHorario = materias.filter((m: any) => {
                // Normalizamos los formatos de hora para la comparación
                const horaInicioHorario = horario.hora_inicio.substring(0, 5);
                const horaFinHorario = horario.hora_fin.substring(0, 5);
                
                console.log('Comparando horas:', {
                  materia: m.materia,
                  hora_inicio_materia: m.hora_inicio,
                  hora_fin_materia: m.hora_fin,
                  hora_inicio_horario: horaInicioHorario,
                  hora_fin_horario: horaFinHorario
                });
                
                return m.hora_inicio === horaInicioHorario && 
                       m.hora_fin === horaFinHorario;
              });
              
              console.log('Materias filtradas:', materiasDelHorario);
              
              // Actualizamos el horario con sus materias
              horario.materias_asignadas = materiasDelHorario.length > 0
                ? materiasDelHorario
                    .map((m: any) => `${m.materia} (${m.curso})`)
                    .join(', ')
                : 'Sin materias asignadas';
                
              console.log('Horario actualizado:', horario);
            } catch (error) {
              console.error(`Error al procesar horario ${horario.dia_semana}:`, error);
              horario.materias_asignadas = 'Error al cargar materias';
            }
          }
          
          this.Filtrados = [...this.horarios];
          Swal.close();
        };
        
        procesarHorarios();
      },
      error: (error) => {
        console.error('Error al obtener horarios:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudieron cargar los horarios'
        });
      }
    });
  }

  buscar(): void {
    const termino = this.filtro.trim().toLowerCase();
    if (termino === '') {
      this.Filtrados = this.horarios;
    } else {
      this.Filtrados = this.horarios.filter(horario =>
        `${horario.nombre} ${horario.dia_semana} ${horario.hora_inicio} ${horario.hora_fin} ${horario.materias_asignadas}`
          .toLowerCase()
          .includes(termino)
      );
    }
  }

  openModalToUpdate(data: any) {
    this.nombreUpdate = data.nombre;
    this.horaInicioUpdate = data.hora_inicio;
    this.horaFinUpdate = data.hora_fin;
    this.selectedDiaUpdate = data.dia_semana;
    this.idSelected = data.id;
    this.isModalUpdateOpen = true;
  }

  actualizar() {
    if (!this.nombreUpdate || !this.horaInicioUpdate || !this.horaFinUpdate || !this.selectedDiaUpdate) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Todos los campos son obligatorios'
      });
      return;
    }

    const data = {
      nombre: this.nombreUpdate,
      hora_inicio: this.horaInicioUpdate,
      hora_fin: this.horaFinUpdate,
      dia_semana: this.selectedDiaUpdate
    };

    this.horarioService.update(this.idSelected, data).subscribe({
      next: (resp) => {
        Swal.fire({
          icon: 'success',
          title: 'Éxito',
          text: 'Horario actualizado correctamente',
          timer: 1500,
          showConfirmButton: false
        });
        this.getAll();
        this.closeUpdateModal();
      },
      error: (error) => {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: error.error?.message || 'Error al actualizar el horario'
        });
      }
    });
  }

  delete(horario: any) {
    Swal.fire({
      title: '¿Estás seguro?',
      text: `¿Deseas eliminar el horario ${horario.nombre}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.horarioService.delete(horario.id).subscribe({
          next: (resp) => {
            Swal.fire({
              icon: 'success',
              title: 'Éxito',
              text: 'Horario eliminado correctamente',
              timer: 1500,
              showConfirmButton: false
            });
            this.getAll();
          },
          error: (error) => {
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: error.error?.message || 'Error al eliminar el horario'
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
