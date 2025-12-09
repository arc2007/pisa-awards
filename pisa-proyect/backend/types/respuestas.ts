// backend/types/respuestas.ts
import type { Categoria } from "./categoria";
import type { CategoriaNominado } from "./nominado";
import type { Usuario } from "./usuario";

export interface TopNominadoResumen {
  nominadoUsuarioId: number;
  display_name: string;
  votos: number;
}

export type CategoriaNominadoRespuesta = CategoriaNominado & {
  usuario: Usuario;
};

export interface CategoriaConNominados extends Categoria {
  nominados: CategoriaNominadoRespuesta[];
}

export interface CategoriaEstado extends Categoria {
  nominados: CategoriaNominadoRespuesta[];
  haVotado: boolean;
  topNominados: TopNominadoResumen[];
}
