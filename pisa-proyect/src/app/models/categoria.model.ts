import { Usuario } from './usuario.model';

export interface Categoria {
  id: number;
  nombre: string;
  descripcion: string | null;
  es_videos: boolean;
}

// Nominación con usuarios ligados (como te llega del backend)
export interface Nominacion {
  id: number;
  categoria_id: number;
  descripcion: string;
  video_url: string | null;
  usuarios: Usuario[];
}

export interface TopNominadoResumen {
  nominacionId: number;
  descripcion: string;
  usuarios: { id: number; display_name: string }[];
  votos: number;
}

export interface CategoriaConNominados extends Categoria {
  nominados: Nominacion[];
}

export interface CategoriaEstado extends Categoria {
  nominados: Nominacion[];
  haVotado: boolean;
  topNominados: TopNominadoResumen[];
}
