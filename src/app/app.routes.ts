import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { UsuarioComponent } from './pages/usuario/usuario.component';
import { RolComponent } from './pages/rol/rol.component';
import { RegisterAdminComponent } from './pages/register-admin/register-admin.component';
import { DocentesComponent } from './pages/docentes/docentes.component';
import { EstudiantesComponent } from './pages/estudiantes/estudiantes.component';
import { PadresTutoresComponent } from './pages/padres-tutores/padres-tutores.component';
import { MateriasComponent } from './pages/materias/materias.component';
import { CursosComponent } from './pages/cursos/cursos.component';
import { HorariosComponent } from './pages/horarios/horarios.component';
import { MatriculasComponent } from './pages/matriculas/matriculas.component';
import { AsistenciasComponent } from './pages/asistencias/asistencias.component';
import { ExamenesComponent } from './pages/examenes/examenes.component';
import { ParticipacionesComponent } from './pages/participaciones/participaciones.component';
import { TareasComponent } from './pages/tareas/tareas.component';
import { TiposExamenComponent } from './pages/tipos-examen/tipos-examen.component';
import { SeguimientoComponent } from './pages/seguimiento/seguimiento.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'registro', component: RegisterAdminComponent },
  { path: 'usuario', component: UsuarioComponent },
  { path: 'roles', component: RolComponent },
  { path: 'docentes', component: DocentesComponent },
  { path: 'estudiantes', component: EstudiantesComponent },
  { path: 'tutores', component: PadresTutoresComponent },
  { path: 'materias', component: MateriasComponent },
  { path: 'cursos', component: CursosComponent },
  { path: 'horarios', component: HorariosComponent },
  { path: 'matricula', component: MatriculasComponent },
  { path: 'examenes', component: TiposExamenComponent },
  { path: 'asistencias', component: AsistenciasComponent },
  { path: 'participaciones', component: ParticipacionesComponent },
  { path: 'tareas', component: TareasComponent },
  { path: 'evaluaciones', component: ExamenesComponent },
  { path: 'seguimiento', component: SeguimientoComponent },

  { path: '', redirectTo: 'login', pathMatch: 'full' },  //inicio de sesion por defecto
  { path: '**', redirectTo: '/login/' },
];
