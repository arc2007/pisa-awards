export type RolUsuario = 'admin' | 'interno' | 'externo';

export interface Usuario {
  id: number;
  username: string;
  display_name: string;
  rol: RolUsuario;
}
