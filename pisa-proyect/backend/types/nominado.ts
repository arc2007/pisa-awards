import type { Usuario } from "./usuario";

export interface CategoriaNominado {
  id: number;             // id en categoria_nominados
  categoria_id: number;
  usuario_id: number;
  video_url: string | null;

  // Para las respuestas de la API (incluye datos del usuario)
  usuario?: Usuario;
}
