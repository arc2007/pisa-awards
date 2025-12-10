// backend/types/nominado.ts
import type { Usuario } from "./usuario";

/**
 * Representa una nominación dentro de una categoría.
 * (tabla: nominaciones)
 */
export interface CategoriaNominado {
  id: number;          // id en nominaciones
  categoria_id: number;
  descripcion: string;
  video_url: string | null;
}

/**
 * Relación muchos-a-muchos entre nominaciones y usuarios.
 * (tabla: nominacion_usuarios)
 */
export interface NominacionUsuario {
  id: number;          // id en nominacion_usuarios
  nominacion_id: number;
  usuario_id: number;
}

/**
 * Nominación + usuarios asociados (para respuestas de API)
 */
export interface NominacionConUsuarios extends CategoriaNominado {
  usuarios: Usuario[];
}
