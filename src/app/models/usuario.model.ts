export interface Usuario {
  email: string;
  first_name: string;
  last_name: string;
  genero: 'M' | 'F';
  activo: boolean;
  roles: number[];
  password: string;
}