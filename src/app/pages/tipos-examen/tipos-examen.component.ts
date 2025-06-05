import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SeguimientoService } from '../../services/seguimiento.service';
import Swal from 'sweetalert2';

interface TipoExamen {
    id?: number;
    nombre: string;
    descripcion: string;
}

@Component({
    selector: 'app-tipos-examen',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './tipos-examen.component.html',
    styleUrl: './tipos-examen.component.css'
})
export class TiposExamenComponent implements OnInit {
    tiposExamen: TipoExamen[] = [];
    tipoExamen: TipoExamen = {
        nombre: '',
        descripcion: ''
    };
    modoEdicion: boolean = false;

    constructor(
        private seguimientoService: SeguimientoService
    ) { }

    ngOnInit(): void {
        this.cargarTiposExamen();
    }

    cargarTiposExamen(): void {
        Swal.fire({
            title: 'Cargando tipos de examen...',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });

        this.seguimientoService.getAllTiposExamen().subscribe({
            next: (response) => {
                this.tiposExamen = response;
                Swal.close();
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

    guardarTipoExamen(): void {
        if (!this.tipoExamen.nombre) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'El nombre es requerido'
            });
            return;
        }

        Swal.fire({
            title: this.modoEdicion ? 'Actualizando...' : 'Guardando...',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });

        const operacion = this.modoEdicion
            ? this.seguimientoService.updateTipoExamenCompleto(this.tipoExamen.id!, this.tipoExamen)
            : this.seguimientoService.createTipoExamen(this.tipoExamen);

        operacion.subscribe({
            next: () => {
                Swal.fire({
                    icon: 'success',
                    title: 'Éxito',
                    text: this.modoEdicion ? 'Tipo de examen actualizado' : 'Tipo de examen creado',
                    timer: 1500,
                    showConfirmButton: false
                });
                this.limpiarFormulario();
                this.cargarTiposExamen();
            },
            error: (error) => {
                console.error('Error al guardar tipo de examen:', error);
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'No se pudo guardar el tipo de examen'
                });
            }
        });
    }

    editarTipoExamen(tipo: TipoExamen): void {
        this.tipoExamen = { ...tipo };
        this.modoEdicion = true;
    }

    eliminarTipoExamen(tipo: TipoExamen): void {
        Swal.fire({
            title: '¿Está seguro?',
            text: 'Esta acción no se puede deshacer',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        }).then((result) => {
            if (result.isConfirmed) {
                this.seguimientoService.deleteTipoExamen(tipo.id!).subscribe({
                    next: () => {
                        Swal.fire({
                            icon: 'success',
                            title: 'Eliminado',
                            text: 'Tipo de examen eliminado correctamente',
                            timer: 1500,
                            showConfirmButton: false
                        });
                        this.cargarTiposExamen();
                    },
                    error: (error) => {
                        console.error('Error al eliminar tipo de examen:', error);
                        Swal.fire({
                            icon: 'error',
                            title: 'Error',
                            text: 'No se pudo eliminar el tipo de examen'
                        });
                    }
                });
            }
        });
    }

    cancelarEdicion(): void {
        this.limpiarFormulario();
    }

    limpiarFormulario(): void {
        this.tipoExamen = {
            nombre: '',
            descripcion: ''
        };
        this.modoEdicion = false;
    }
} 