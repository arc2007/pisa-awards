// backend/types/respuestas.ts
import type { Categoria } from "./categoria";
import type { NominacionConUsuarios } from "./nominado";
import type { Usuario } from "./usuario";

// Resumen del top de nominaciones dentro de una categoría
export interface TopNominadoResumen {
  nominacionId: number;
  descripcion: string;
  usuarios: Pick<Usuario, "id" | "display_name">[];
  votos: number;
}

// Para mantener el nombre exportado que ya usas en otros sitios
export type CategoriaNominadoRespuesta = NominacionConUsuarios;

export interface CategoriaConNominados extends Categoria {
  // En realidad son nominaciones, pero dejo el nombre "nominados" para no romper tanto front
  nominados: CategoriaNominadoRespuesta[];
}

export interface CategoriaEstado extends Categoria {
  nominados: CategoriaNominadoRespuesta[];
  haVotado: boolean;
  topNominados: TopNominadoResumen[];
}
